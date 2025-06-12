import re
import logging
from typing import List, Dict, Optional, Tuple
from fuzzywuzzy import fuzz, process
from sqlalchemy.orm import Session
from database.models import Product, SKUMapping
from utils.logger import setup_logger

logger = setup_logger(__name__)

class SKUMapperService:
    """Intelligent SKU mapping service for product identification across marketplaces"""
    
    def __init__(self):
        self.patterns = {
            'amazon': re.compile(r'^(B[0-9A-Z]{9}|[A-Z0-9]{10})$'),
            'ebay': re.compile(r'^[0-9]{12}$'),
            'shopify': re.compile(r'^[a-zA-Z0-9\-_]{1,100}$'),
            'walmart': re.compile(r'^[A-Z0-9]{8,15}$'),
            'standard': re.compile(r'^[A-Z]{2,4}-\d{4,8}$'),
            'combo': re.compile(r'^([A-Z]{2,4}-\d{4,8})(,([A-Z]{2,4}-\d{4,8}))*$')
        }
        
        self.marketplace_rules = {
            'amazon': self._process_amazon_sku,
            'ebay': self._process_ebay_sku,
            'shopify': self._process_shopify_sku,
            'walmart': self._process_walmart_sku
        }
    
    def validate_sku(self, sku: str, marketplace: Optional[str] = None) -> bool:
        """Validate SKU format for specific marketplace or general patterns"""
        if not sku or not sku.strip():
            return False
        
        sku = sku.strip().upper()
        
        if marketplace and marketplace in self.patterns:
            return bool(self.patterns[marketplace].match(sku))
        
        # Try all patterns if no specific marketplace
        for pattern in self.patterns.values():
            if pattern.match(sku):
                return True
        
        return False
    
    def map_sku(self, original_sku: str, marketplace: str, db: Session) -> Dict:
        """Map original SKU to internal system with confidence scoring"""
        try:
            logger.info(f"Mapping SKU: {original_sku} from {marketplace}")
            
            # Clean and normalize SKU
            cleaned_sku = self._clean_sku(original_sku)
            
            # Apply marketplace-specific rules
            mapped_sku = self._apply_marketplace_rules(cleaned_sku, marketplace)
            
            # Find existing product match
            existing_product = self._find_existing_product(mapped_sku, marketplace, db)
            
            # Generate MSKU
            msku = self._generate_msku(mapped_sku, marketplace, existing_product)
            
            # Calculate confidence
            confidence = self._calculate_confidence(
                original_sku, mapped_sku, existing_product, marketplace
            )
            
            # Determine mapping method
            mapping_method = self._determine_mapping_method(confidence, existing_product)
            
            mapping_result = {
                'original_sku': original_sku,
                'mapped_sku': mapped_sku,
                'msku': msku,
                'marketplace': marketplace,
                'confidence': confidence,
                'mapping_method': mapping_method,
                'product_id': existing_product.id if existing_product else None,
                'notes': self._generate_mapping_notes(confidence, existing_product)
            }
            
            logger.info(f"SKU mapping completed: {mapping_result}")
            return mapping_result
            
        except Exception as e:
            logger.error(f"Error mapping SKU {original_sku}: {str(e)}")
            raise
    
    def batch_map_skus(self, sku_list: List[Dict], marketplace: str, db: Session) -> List[Dict]:
        """Process multiple SKUs in batch for efficiency"""
        results = []
        
        for sku_data in sku_list:
            try:
                result = self.map_sku(sku_data['sku'], marketplace, db)
                result.update(sku_data)  # Add any additional data
                results.append(result)
            except Exception as e:
                logger.error(f"Error in batch mapping for SKU {sku_data.get('sku')}: {str(e)}")
                results.append({
                    'original_sku': sku_data.get('sku'),
                    'error': str(e),
                    'confidence': 0.0,
                    'mapping_method': 'failed'
                })
        
        return results
    
    def _clean_sku(self, sku: str) -> str:
        """Clean and normalize SKU format"""
        if not sku:
            return ""
        
        # Remove extra whitespace and quotes
        cleaned = sku.strip().strip('"\'')
        
        # Handle common formatting issues
        cleaned = re.sub(r'\s+', '-', cleaned)  # Replace spaces with hyphens
        cleaned = re.sub(r'[^\w\-]', '', cleaned)  # Remove special characters except hyphens
        
        return cleaned.upper()
    
    def _apply_marketplace_rules(self, sku: str, marketplace: str) -> str:
        """Apply marketplace-specific SKU transformation rules"""
        if marketplace in self.marketplace_rules:
            return self.marketplace_rules[marketplace](sku)
        return sku
    
    def _process_amazon_sku(self, sku: str) -> str:
        """Process Amazon ASIN/SKU"""
        if sku.startswith('B') and len(sku) == 10:
            return f"AMZ-{sku}"
        return sku
    
    def _process_ebay_sku(self, sku: str) -> str:
        """Process eBay Item ID"""
        if re.match(r'^\d{12}$', sku):
            return f"EBY-{sku[-8:]}"
        return sku
    
    def _process_shopify_sku(self, sku: str) -> str:
        """Process Shopify variant SKU"""
        # Remove non-alphanumeric characters except hyphens
        cleaned = re.sub(r'[^a-zA-Z0-9\-]', '', sku)
        return f"SHO-{cleaned}"
    
    def _process_walmart_sku(self, sku: str) -> str:
        """Process Walmart SKU"""
        if re.match(r'^[A-Z0-9]{8,15}$', sku):
            return f"WMT-{sku}"
        return sku
    
    def _find_existing_product(self, mapped_sku: str, marketplace: str, db: Session) -> Optional[Product]:
        """Find existing product by SKU or marketplace listing"""
        # Direct SKU match
        product = db.query(Product).filter(Product.sku == mapped_sku).first()
        if product:
            return product
        
        # MSKU match
        product = db.query(Product).filter(Product.msku == mapped_sku).first()
        if product:
            return product
        
        # Marketplace listing match
        from database.models import MarketplaceListing
        listing = db.query(MarketplaceListing).filter(
            MarketplaceListing.marketplace_sku == mapped_sku,
            MarketplaceListing.platform == marketplace
        ).first()
        
        if listing:
            return listing.product
        
        # Fuzzy matching for similar products
        return self._fuzzy_match_product(mapped_sku, db)
    
    def _fuzzy_match_product(self, sku: str, db: Session, threshold: int = 80) -> Optional[Product]:
        """Use fuzzy matching to find similar products"""
        products = db.query(Product).all()
        
        if not products:
            return None
        
        # Create list of SKUs for fuzzy matching
        sku_list = [p.sku for p in products if p.sku]
        msku_list = [p.msku for p in products if p.msku]
        
        # Try fuzzy matching on SKUs
        match = process.extractOne(sku, sku_list, scorer=fuzz.ratio)
        if match and match[1] >= threshold:
            return next(p for p in products if p.sku == match[0])
        
        # Try fuzzy matching on MSKUs
        match = process.extractOne(sku, msku_list, scorer=fuzz.ratio)
        if match and match[1] >= threshold:
            return next(p for p in products if p.msku == match[0])
        
        return None
    
    def _generate_msku(self, mapped_sku: str, marketplace: str, existing_product: Optional[Product]) -> str:
        """Generate Master SKU (MSKU)"""
        if existing_product and existing_product.msku:
            return existing_product.msku
        
        if existing_product:
            return existing_product.sku
        
        # Generate new MSKU
        prefix = marketplace.upper()[:3]
        hash_value = self._simple_hash(mapped_sku)
        return f"WMS-{prefix}-{hash_value}"
    
    def _simple_hash(self, text: str) -> str:
        """Generate simple hash for MSKU generation"""
        hash_value = 0
        for char in text:
            hash_value = ((hash_value << 5) - hash_value) + ord(char)
            hash_value = hash_value & 0xFFFFFFFF  # Convert to 32-bit integer
        
        return format(abs(hash_value), 'X')[:6]
    
    def _calculate_confidence(self, original_sku: str, mapped_sku: str, 
                            existing_product: Optional[Product], marketplace: str) -> float:
        """Calculate mapping confidence score"""
        confidence = 0.5  # Base confidence
        
        # SKU format validation
        if self.validate_sku(original_sku, marketplace):
            confidence += 0.2
        
        # Existing product match
        if existing_product:
            confidence += 0.3
            
            # Exact match bonus
            if existing_product.sku == mapped_sku:
                confidence = 1.0
        
        # Marketplace-specific rules applied
        if marketplace in self.marketplace_rules:
            confidence += 0.1
        
        # SKU complexity (longer, more structured SKUs are more reliable)
        if len(original_sku) >= 8 and '-' in original_sku:
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _determine_mapping_method(self, confidence: float, existing_product: Optional[Product]) -> str:
        """Determine the mapping method based on confidence and existing data"""
        if existing_product and confidence >= 0.9:
            return 'automatic'
        elif confidence >= 0.7:
            return 'ai_suggested'
        else:
            return 'manual'
    
    def _generate_mapping_notes(self, confidence: float, existing_product: Optional[Product]) -> str:
        """Generate helpful notes for the mapping"""
        notes = []
        
        if confidence >= 0.9:
            notes.append("High confidence automatic mapping")
        elif confidence >= 0.7:
            notes.append("AI suggested mapping - review recommended")
        else:
            notes.append("Low confidence mapping - manual review required")
        
        if existing_product:
            notes.append(f"Matched to existing product: {existing_product.name}")
        else:
            notes.append("No existing product match found")
        
        return "; ".join(notes)
    
    def process_combo_sku(self, combo_sku: str) -> List[str]:
        """Process combo SKUs (multiple SKUs in one field)"""
        if not self.patterns['combo'].match(combo_sku):
            return [combo_sku]
        
        return [sku.strip() for sku in combo_sku.split(',')]
    
    def validate_mapping_batch(self, mappings: List[Dict]) -> Dict:
        """Validate a batch of mappings and return statistics"""
        valid_mappings = []
        invalid_mappings = []
        warnings = []
        
        for mapping in mappings:
            if self.validate_sku(mapping.get('original_sku'), mapping.get('marketplace')):
                valid_mappings.append(mapping)
                
                if mapping.get('confidence', 0) < 0.6:
                    warnings.append(f"Low confidence mapping for SKU: {mapping['original_sku']}")
            else:
                invalid_mappings.append(mapping)
        
        return {
            'valid': valid_mappings,
            'invalid': invalid_mappings,
            'warnings': warnings,
            'total_processed': len(mappings),
            'success_rate': len(valid_mappings) / len(mappings) if mappings else 0
        }