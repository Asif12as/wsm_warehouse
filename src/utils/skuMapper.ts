import { Product, SKUMapping, Marketplace } from '../types';

export class SKUMapper {
  private patterns: Map<string, RegExp> = new Map();
  private marketplaceRules: Map<string, (sku: string) => string> = new Map();

  constructor() {
    this.initializePatterns();
    this.initializeMarketplaceRules();
  }

  private initializePatterns(): void {
    // Common SKU patterns
    this.patterns.set('standard', /^[A-Z]{2,4}-\d{4,8}$/);
    this.patterns.set('amazon', /^(B[0-9A-Z]{9}|[A-Z0-9]{10})$/);
    this.patterns.set('ebay', /^[0-9]{12}$/);
    this.patterns.set('shopify', /^[a-zA-Z0-9\-_]{1,100}$/);
    this.patterns.set('combo', /^([A-Z]{2,4}-\d{4,8})(,([A-Z]{2,4}-\d{4,8}))*$/);
  }

  private initializeMarketplaceRules(): void {
    this.marketplaceRules.set('amazon', (sku: string) => {
      // Amazon ASIN to internal SKU mapping
      if (sku.startsWith('B') && sku.length === 10) {
        return `AMZ-${sku.slice(1)}`;
      }
      return sku;
    });

    this.marketplaceRules.set('ebay', (sku: string) => {
      // eBay Item ID to internal SKU mapping
      if (/^\d{12}$/.test(sku)) {
        return `EBY-${sku.slice(-8)}`;
      }
      return sku;
    });

    this.marketplaceRules.set('shopify', (sku: string) => {
      // Shopify variant ID to internal SKU mapping
      return sku.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase();
    });
  }

  public validateSKU(sku: string, marketplace?: string): boolean {
    if (!sku || sku.trim().length === 0) return false;

    if (marketplace) {
      const pattern = this.patterns.get(marketplace);
      if (pattern) {
        return pattern.test(sku);
      }
    }

    // Try all patterns
    for (const [, pattern] of this.patterns) {
      if (pattern.test(sku)) return true;
    }

    return false;
  }

  public mapSKU(originalSku: string, marketplace: string, existingProducts: Product[]): SKUMapping {
    const mappingId = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let mappedSku = originalSku;
    let msku = '';
    let confidence = 0.5;
    let mappingMethod: 'automatic' | 'manual' | 'ai_suggested' = 'automatic';

    // Apply marketplace-specific rules
    const rule = this.marketplaceRules.get(marketplace);
    if (rule) {
      mappedSku = rule(originalSku);
      confidence = 0.8;
    }

    // Try to find existing product match
    const exactMatch = existingProducts.find(p => 
      p.sku === mappedSku || 
      p.marketplaces.some(m => m.sku === originalSku)
    );

    if (exactMatch) {
      msku = exactMatch.msku || exactMatch.sku;
      confidence = 1.0;
    } else {
      // Generate MSKU based on product characteristics
      msku = this.generateMSKU(mappedSku, marketplace);
      
      // Use fuzzy matching to find similar products
      const similarProduct = this.findSimilarProduct(mappedSku, existingProducts);
      if (similarProduct) {
        msku = similarProduct.msku || similarProduct.sku;
        confidence = 0.7;
        mappingMethod = 'ai_suggested';
      }
    }

    return {
      id: mappingId,
      originalSku,
      mappedSku,
      msku,
      marketplace,
      confidence,
      mappingMethod,
      createdAt: new Date(),
    };
  }

  private generateMSKU(sku: string, marketplace: string): string {
    // Generate a master SKU based on product characteristics
    const prefix = marketplace.toUpperCase().slice(0, 3);
    const hash = this.simpleHash(sku);
    return `${prefix}-${hash}`;
  }

  private findSimilarProduct(sku: string, products: Product[]): Product | null {
    const skuBase = sku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    for (const product of products) {
      const productBase = product.sku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const similarity = this.calculateSimilarity(skuBase, productBase);
      
      if (similarity > 0.8) {
        return product;
      }
    }
    
    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / maxLen;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
  }

  public processComboSKU(comboSku: string): string[] {
    if (!this.patterns.get('combo')?.test(comboSku)) {
      return [comboSku];
    }
    
    return comboSku.split(',').map(sku => sku.trim());
  }

  public validateMappingBatch(mappings: SKUMapping[]): { valid: SKUMapping[], invalid: SKUMapping[], warnings: string[] } {
    const valid: SKUMapping[] = [];
    const invalid: SKUMapping[] = [];
    const warnings: string[] = [];

    for (const mapping of mappings) {
      if (this.validateSKU(mapping.originalSku, mapping.marketplace)) {
        valid.push(mapping);
        
        if (mapping.confidence < 0.6) {
          warnings.push(`Low confidence mapping for SKU: ${mapping.originalSku}`);
        }
      } else {
        invalid.push(mapping);
      }
    }

    return { valid, invalid, warnings };
  }
}