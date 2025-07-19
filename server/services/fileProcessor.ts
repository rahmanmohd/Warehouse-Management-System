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
      let headers: string[] = [];

      // Check if file exists and is readable
      if (!fs.existsSync(filePath)) {
        return reject(new Error('File not found'));
      }

      // First pass: count total rows and get headers
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList: string[]) => {
          headers = headerList;
          console.log('CSV Headers detected:', headers);
        })
        .on('data', () => totalRows++)
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          reject(new Error(`CSV parsing failed: ${error.message}`));
        })
        .on('end', async () => {
          await storage.updateFileUpload(uploadId, { totalRows });

          // Validate required columns exist
          const requiredColumns = ['sku', 'quantity', 'revenue'];
          const missingColumns = requiredColumns.filter(col => 
            !headers.some(header => header.toLowerCase().includes(col.toLowerCase()))
          );

          if (missingColumns.length > 0) {
            return reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          }

          // Second pass: process data
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row: SalesDataRow) => {
              rows.push(row);
            })
            .on('error', (error) => {
              reject(new Error(`CSV processing failed: ${error.message}`));
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
      // Extract data with flexible column naming - case insensitive
      const getColumnValue = (possibleNames: string[]): string => {
        for (const name of possibleNames) {
          for (const key in row) {
            if (key.toLowerCase().includes(name.toLowerCase())) {
              return row[key] || '';
            }
          }
        }
        return '';
      };

      const skuCode = getColumnValue(['sku', 'product_sku', 'productsku', 'product_code']);
      const productName = getColumnValue(['product_name', 'productname', 'name', 'title', 'product_title']);
      const marketplace = getColumnValue(['marketplace', 'channel', 'platform', 'source']) || 'unknown';
      const orderDateStr = getColumnValue(['order_date', 'orderdate', 'date', 'transaction_date']);
      const quantityStr = getColumnValue(['quantity', 'qty', 'units', 'count']);
      const revenueStr = getColumnValue(['revenue', 'price', 'amount', 'total', 'value', 'sales']);

      // Validate required fields
      if (!skuCode.trim()) {
        console.warn('Skipping row without SKU:', Object.keys(row).slice(0, 3));
        return;
      }

      // Parse numeric values with validation
      const quantity = parseInt(quantityStr) || 1;
      const revenue = parseFloat(revenueStr.replace(/[^\d.-]/g, '')) || 0;
      
      // Parse date
      let orderDate = new Date();
      if (orderDateStr) {
        const parsedDate = new Date(orderDateStr);
        if (!isNaN(parsedDate.getTime())) {
          orderDate = parsedDate;
        }
      }

      // Get or create SKU
      let sku = await storage.getSkuByCode(skuCode.trim());
      if (!sku) {
        sku = await storage.createSku({
          sku: skuCode.trim(),
          name: productName.trim() || skuCode.trim(),
          marketplace: marketplace.toLowerCase().trim()
        });
      }

      // Try to find existing mapping
      const mappings = await storage.getAllMappings();
      const existingMapping = mappings.find(m => m.sku.id === sku!.id);

      // Create sales data entry
      await storage.createSalesData({
        skuId: sku.id,
        mskuId: existingMapping?.msku.id || null,
        orderDate,
        quantity,
        revenue: revenue.toString(),
        marketplace: marketplace.toLowerCase().trim(),
        rawData: row
      });

    } catch (error) {
      console.error('Error processing row:', error, 'Row data:', row);
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
