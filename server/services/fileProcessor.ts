import * as fs from 'fs';
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
  async processFile(uploadId: number, filePath: string, originalName?: string): Promise<void> {
    try {
      await storage.updateFileUpload(uploadId, { 
        status: 'processing',
        progress: 0
      });

      // Check if it's a CSV file based on original filename
      const isCSV = originalName ? originalName.toLowerCase().endsWith('.csv') : path.extname(filePath).toLowerCase() === '.csv';
      
      console.log('File processing details:');
      console.log('- Original name:', originalName);
      console.log('- File path:', filePath);
      console.log('- Is CSV:', isCSV);
      
      if (isCSV) {
        await this.processCsvFile(uploadId, filePath);
      } else {
        const fileType = originalName ? path.extname(originalName) : path.extname(filePath);
        throw new Error(`Unsupported file type: ${fileType || 'unknown'}. Only CSV files are supported.`);
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
    // Simple CSV processing without external library
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse headers with better CSV parsing
    const headers = this.parseCSVLine(lines[0]);
    console.log('CSV Headers detected:', headers);

    // Validate required columns (more flexible approach)
    const hasSkuColumn = headers.some(header => 
      header.toLowerCase().includes('sku') || 
      header.toLowerCase().includes('product') ||
      header.toLowerCase().includes('fsn') ||
      header.toLowerCase().includes('asin') ||
      header.toLowerCase().includes('msku')
    );
    
    if (!hasSkuColumn) {
      throw new Error('Missing product identifier column (SKU, Product, FSN, ASIN, or MSKU)');
    }

    console.log('CSV validation passed - found product identifier column');

    const totalRows = lines.length - 1; // Exclude header
    await storage.updateFileUpload(uploadId, { totalRows });

    let processedRows = 0;

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const row: SalesDataRow = {};
        
        // Map values to headers
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        await this.processRow(row);
        processedRows++;
        
        const progress = Math.floor((processedRows / totalRows) * 100);
        await storage.updateFileUpload(uploadId, { 
          progress,
          rowsProcessed: processedRows
        });
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        // Continue with other rows
      }
    }

    console.log(`Processed ${processedRows} rows successfully`);
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

      const skuCode = getColumnValue(['sku', 'product_sku', 'productsku', 'product_code', 'fsn', 'asin', 'msku']);
      const productName = getColumnValue(['product_name', 'productname', 'name', 'title', 'product_title', 'product']);
      const marketplace = getColumnValue(['marketplace', 'channel', 'platform', 'source']) || 'unknown';
      const orderDateStr = getColumnValue(['order_date', 'orderdate', 'date', 'transaction_date', 'ordered on', 'invoice date']);
      const quantityStr = getColumnValue(['quantity', 'qty', 'units', 'count', 'reconciled quantity']);
      const revenueStr = getColumnValue(['revenue', 'price', 'amount', 'total', 'value', 'sales', 'invoice amount', 'selling price per item']);

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

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}

export const fileProcessor = new FileProcessor();
