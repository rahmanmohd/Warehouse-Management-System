import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as path from 'path';
import { storage } from '../storage';

interface SalesDataRow {
  sku?: string;
  product_name?: string;
  marketplace?: string;
  order_date?: string;
  quantity?: string;
  revenue?: string;
  [key: string]: any;
}

export class FileProcessor {
  async processFile(uploadId: number, filePath: string): Promise<void> {
    try {
      await storage.updateFileUpload(uploadId, { 
        status: 'processing',
        progress: 0
      });

      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.csv') {
        await this.processCsvFile(uploadId, filePath);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      await storage.updateFileUpload(uploadId, { 
        status: 'completed',
        progress: 100
      });

    } catch (error) {
      console.error('File processing error:', error);
      await storage.updateFileUpload(uploadId, { 
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
  }

  private async processCsvFile(uploadId: number, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const rows: SalesDataRow[] = [];
      let totalRows = 0;
      let processedRows = 0;

      // First pass: count total rows
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', () => totalRows++)
        .on('end', async () => {
          await storage.updateFileUpload(uploadId, { totalRows });

          // Second pass: process data
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row: SalesDataRow) => {
              rows.push(row);
            })
            .on('end', async () => {
              try {
                for (const row of rows) {
                  await this.processRow(row);
                  processedRows++;
                  
                  const progress = Math.floor((processedRows / totalRows) * 100);
                  await storage.updateFileUpload(uploadId, { 
                    progress,
                    rowsProcessed: processedRows
                  });
                }
                resolve();
              } catch (error) {
                reject(error);
              }
            })
            .on('error', reject);
        })
        .on('error', reject);
    });
  }

  private async processRow(row: SalesDataRow): Promise<void> {
    try {
      // Extract and validate data
      const skuCode = row.sku || row.SKU || row.product_sku;
      const productName = row.product_name || row.name || row.product;
      const marketplace = row.marketplace || row.channel || row.platform;
      const orderDate = row.order_date || row.date || row.order_timestamp;
      const quantity = parseInt(row.quantity || row.qty || '1');
      const revenue = parseFloat(row.revenue || row.amount || row.price || '0');

      if (!skuCode || !marketplace) {
        console.warn('Skipping row with missing required fields:', row);
        return;
      }

      // Get or create SKU
      let sku = await storage.getSkuByCode(skuCode);
      if (!sku) {
        sku = await storage.createSku({
          sku: skuCode,
          name: productName || skuCode,
          marketplace: marketplace
        });
      }

      // Try to find existing mapping
      const mappings = await storage.getAllMappings();
      const existingMapping = mappings.find(m => m.sku.id === sku!.id);

      // Create sales data entry
      await storage.createSalesData({
        skuId: sku.id,
        mskuId: existingMapping?.msku.id || null,
        orderDate: new Date(orderDate || Date.now()),
        quantity: quantity,
        revenue: revenue.toString(),
        marketplace: marketplace,
        rawData: row
      });

    } catch (error) {
      console.error('Error processing row:', error, row);
      // Continue processing other rows
    }
  }

  private normalizeSkuName(skuName: string): string {
    return skuName
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractProductInfo(skuName: string): {
    baseProduct: string;
    marketplace: string;
    variant?: string;
  } {
    const lowerSku = skuName.toLowerCase();
    
    let marketplace = 'unknown';
    if (lowerSku.includes('flipkart')) marketplace = 'flipkart';
    else if (lowerSku.includes('amazon')) marketplace = 'amazon';
    else if (lowerSku.includes('shopify')) marketplace = 'shopify';
    
    const baseProduct = skuName
      .replace(/-?(flipkart|amazon|shopify|ebay)/gi, '')
      .replace(/[-_]/g, ' ')
      .trim();

    return { baseProduct, marketplace };
  }
}

export const fileProcessor = new FileProcessor();
