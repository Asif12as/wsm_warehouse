import { SalesRecord, DataProcessingJob, Product } from '../types';
import { SKUMapper } from './skuMapper';

export class DataProcessor {
  private skuMapper: SKUMapper;

  constructor() {
    this.skuMapper = new SKUMapper();
  }

  public async processFile(
    file: File,
    marketplace: string,
    existingProducts: Product[],
    onProgress?: (progress: number) => void
  ): Promise<DataProcessingJob> {
    const job: DataProcessingJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      marketplace,
      status: 'processing',
      progress: 0,
      recordsProcessed: 0,
      recordsTotal: 0,
      errors: [],
      warnings: [],
      createdAt: new Date(),
    };

    try {
      const content = await this.readFileContent(file);
      const records = await this.parseCSVContent(content);
      
      job.recordsTotal = records.length;
      
      const processedRecords: SalesRecord[] = [];
      
      for (let i = 0; i < records.length; i++) {
        try {
          const record = await this.processRecord(records[i], marketplace, existingProducts, i + 1);
          if (record) {
            processedRecords.push(record);
          }
          
          job.recordsProcessed = i + 1;
          job.progress = Math.round((i + 1) / records.length * 100);
          
          if (onProgress) {
            onProgress(job.progress);
          }
          
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
          job.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
      
      // Store processed records (in a real app, this would go to a database)
      this.storeProcessedRecords(processedRecords);
      
    } catch (error) {
      job.status = 'failed';
      job.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
    }

    return job;
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private async parseCSVContent(content: string): Promise<any[]> {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty file');

    // Handle CSV parsing with proper quote handling
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      // Skip empty rows
      if (Object.values(record).some(value => value && value.toString().trim())) {
        records.push(record);
      }
    }

    return records;
  }

  private async processRecord(
    rawRecord: any,
    marketplace: string,
    existingProducts: Product[],
    rowNumber: number
  ): Promise<SalesRecord | null> {
    // Get comprehensive header mapping for the marketplace
    const headerMapping = this.getHeaderMapping(marketplace);
    const mappedRecord: any = {};

    // Map fields with better matching logic
    for (const [ourField, possibleHeaders] of Object.entries(headerMapping)) {
      let value = null;
      
      // Try exact matches first
      for (const header of possibleHeaders) {
        if (rawRecord[header] !== undefined && rawRecord[header] !== '') {
          value = rawRecord[header];
          break;
        }
      }
      
      // If no exact match, try case-insensitive partial matches
      if (value === null) {
        const recordKeys = Object.keys(rawRecord);
        for (const header of possibleHeaders) {
          const matchingKey = recordKeys.find(key => 
            key.toLowerCase().includes(header.toLowerCase()) ||
            header.toLowerCase().includes(key.toLowerCase())
          );
          if (matchingKey && rawRecord[matchingKey] !== undefined && rawRecord[matchingKey] !== '') {
            value = rawRecord[matchingKey];
            break;
          }
        }
      }
      
      mappedRecord[ourField] = value;
    }

    // Enhanced validation with better error messages
    const validationErrors: string[] = [];
    
    if (!mappedRecord.sku || mappedRecord.sku.toString().trim() === '') {
      // Try to find any field that might be a SKU
      const possibleSkuFields = Object.keys(rawRecord).filter(key => 
        key.toLowerCase().includes('sku') || 
        key.toLowerCase().includes('asin') ||
        key.toLowerCase().includes('item') ||
        key.toLowerCase().includes('product')
      );
      
      if (possibleSkuFields.length > 0) {
        mappedRecord.sku = rawRecord[possibleSkuFields[0]];
      } else {
        validationErrors.push('Missing required field: SKU (also looked for ASIN, Item ID, Product ID)');
      }
    }
    
    if (!mappedRecord.orderId || mappedRecord.orderId.toString().trim() === '') {
      // For Amazon inventory reports, use a combination of Date + FNSKU + ASIN as unique identifier
      if (rawRecord['Date'] && (rawRecord['FNSKU'] || rawRecord['ASIN'])) {
        mappedRecord.orderId = `${rawRecord['Date']}-${rawRecord['FNSKU'] || rawRecord['ASIN']}-${rowNumber}`;
      } else {
        validationErrors.push('Missing required field: Order ID (for inventory reports, using Date + FNSKU/ASIN combination)');
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('; '));
    }

    // Process SKU mapping
    const skuMapping = this.skuMapper.mapSKU(mappedRecord.sku, marketplace, existingProducts);

    // Create sales record with better default handling
    const salesRecord: SalesRecord = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: mappedRecord.orderId.toString(),
      marketplace,
      sku: skuMapping.originalSku,
      msku: skuMapping.msku,
      productName: mappedRecord.productName || mappedRecord.sku || 'Unknown Product',
      quantity: this.parseNumber(mappedRecord.quantity, 1),
      unitPrice: this.parseNumber(mappedRecord.unitPrice, 0),
      totalAmount: this.parseNumber(mappedRecord.totalAmount, 0),
      fees: this.parseNumber(mappedRecord.fees, 0),
      netAmount: this.parseNumber(mappedRecord.netAmount, 0),
      orderDate: this.parseDate(mappedRecord.orderDate),
      status: mappedRecord.status || 'pending',
    };

    // Calculate derived fields
    if (!salesRecord.totalAmount && salesRecord.unitPrice && salesRecord.quantity) {
      salesRecord.totalAmount = salesRecord.unitPrice * salesRecord.quantity;
    }

    if (!salesRecord.netAmount) {
      salesRecord.netAmount = salesRecord.totalAmount - salesRecord.fees;
    }

    return salesRecord;
  }

  private parseNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // Remove currency symbols and commas
    const cleanValue = value.toString().replace(/[$,£€¥]/g, '').trim();
    const parsed = parseFloat(cleanValue);
    
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private parseDate(value: any): Date {
    if (!value) return new Date();
    
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch {
      return new Date();
    }
  }

  private getHeaderMapping(marketplace: string): Record<string, string[]> {
    const baseMapping = {
      orderId: [
        'order-id', 'Order ID', 'OrderId', 'order_id', 'Order Number',
        'amazon-order-id', 'Amazon Order ID', 'order id', 'orderid',
        'Reference ID', 'Reference'
      ],
      sku: [
        'sku', 'SKU', 'Product SKU', 'Item SKU', 'product-sku',
        'ASIN', 'asin', 'Item ID', 'item-id', 'product_sku',
        'FNSKU', 'MSKU'
      ],
      productName: [
        'product-name', 'Product Name', 'Title', 'Item Name', 'product_name',
        'title', 'item-title', 'Product Title', 'item name', 'product name'
      ],
      quantity: [
        'quantity', 'Quantity', 'Qty', 'qty', 'Quantity Purchased',
        'quantity-purchased', 'Quantity Ordered', 'Units', 'units'
      ],
      unitPrice: [
        'unit-price', 'Unit Price', 'Price', 'Item Price', 'unit_price',
        'price', 'item-price', 'Product Price', 'unit price', 'item price'
      ],
      totalAmount: [
        'total', 'Total', 'Amount', 'Order Total', 'total_amount',
        'total-price', 'Total Price', 'Line Total', 'order-total', 'total amount'
      ],
      fees: [
        'fees', 'Fees', 'Commission', 'Platform Fee', 'fees',
        'amazon-fee', 'Amazon Fee', 'referral-fee', 'Referral Fee', 'commission'
      ],
      netAmount: [
        'net', 'Net Amount', 'Net', 'Payout', 'net_amount',
        'net-amount', 'Net Total', 'Proceeds', 'net amount'
      ],
      orderDate: [
        'order-date', 'Order Date', 'Date', 'Purchase Date', 'order_date',
        'purchase-date', 'Transaction Date', 'Sale Date', 'order date', 'date',
        'Update Date and Time'
      ],
      status: [
        'status', 'Status', 'Order Status', 'State', 'order_status',
        'order-status', 'Fulfillment Status', 'Ship Status', 'order status',
        'Disposition', 'Event Type'
      ],
    };

    // Amazon-specific mapping based on your CSV headers
    if (marketplace === 'amazon') {
      return {
        ...baseMapping,
        // Your CSV has these exact headers: Date, FNSKU, ASIN, MSKU, Title, Event Type, Reference ID, Quantity, Fulfillment Center, Disposition, Reason, Country, Reconciled, Unreconciled, Update Date and Time
        orderId: ['Reference ID', 'Reference', ...baseMapping.orderId],
        sku: ['FNSKU', 'ASIN', 'MSKU', ...baseMapping.sku],
        productName: ['Title', ...baseMapping.productName],
        quantity: ['Quantity', ...baseMapping.quantity],
        orderDate: ['Date', 'Update Date and Time', ...baseMapping.orderDate],
        status: ['Event Type', 'Disposition', ...baseMapping.status],
        // Additional Amazon-specific fields
        fulfillmentCenter: ['Fulfillment Center'],
        reason: ['Reason'],
        country: ['Country'],
        reconciled: ['Reconciled'],
        unreconciled: ['Unreconciled']
      };
    }

    if (marketplace === 'ebay') {
      return {
        ...baseMapping,
        sku: [...baseMapping.sku, 'Item ID', 'Custom Label', 'eBay Item ID'],
        orderId: [...baseMapping.orderId, 'Sales Record Number', 'Transaction ID'],
        fees: [...baseMapping.fees, 'eBay Fee', 'Final Value Fee', 'Insertion Fee'],
      };
    }

    if (marketplace === 'shopify') {
      return {
        ...baseMapping,
        sku: [...baseMapping.sku, 'Variant SKU', 'Product SKU', 'Variant ID'],
        orderId: [...baseMapping.orderId, 'Name', 'Order', 'Order Number'],
        orderDate: [...baseMapping.orderDate, 'Created at', 'Created At'],
        status: [...baseMapping.status, 'Fulfillment Status', 'Financial Status'],
      };
    }

    return baseMapping;
  }

  private storeProcessedRecords(records: SalesRecord[]): void {
    // In a real application, this would store to a database
    const existingRecords = JSON.parse(localStorage.getItem('salesRecords') || '[]');
    const updatedRecords = [...existingRecords, ...records];
    localStorage.setItem('salesRecords', JSON.stringify(updatedRecords));
  }

  public getProcessedRecords(): SalesRecord[] {
    return JSON.parse(localStorage.getItem('salesRecords') || '[]');
  }

  public clearProcessedRecords(): void {
    localStorage.removeItem('salesRecords');
  }
}