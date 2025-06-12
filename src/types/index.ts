export interface Product {
  id: string;
  sku: string;
  msku?: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  cost?: number;
  quantity: number;
  reorderPoint: number;
  supplier?: string;
  marketplaces: Marketplace[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Marketplace {
  platform: 'amazon' | 'ebay' | 'shopify' | 'walmart' | 'etsy' | 'custom';
  sku: string;
  listing_id?: string;
  status: 'active' | 'inactive' | 'pending';
  price: number;
  lastSync: Date;
}

export interface SalesRecord {
  id: string;
  orderId: string;
  marketplace: string;
  sku: string;
  msku?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  fees: number;
  netAmount: number;
  orderDate: Date;
  status: 'pending' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  customer?: {
    name: string;
    email: string;
    address: string;
  };
}

export interface SKUMapping {
  id: string;
  originalSku: string;
  mappedSku: string;
  msku: string;
  marketplace: string;
  confidence: number;
  mappingMethod: 'automatic' | 'manual' | 'ai_suggested';
  createdAt: Date;
  validatedAt?: Date;
  notes?: string;
}

export interface DataProcessingJob {
  id: string;
  fileName: string;
  fileSize: number;
  marketplace: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  recordsProcessed: number;
  recordsTotal: number;
  errors: string[];
  warnings: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface QueryResult {
  id: string;
  query: string;
  sql: string;
  results: any[];
  executionTime: number;
  createdAt: Date;
}