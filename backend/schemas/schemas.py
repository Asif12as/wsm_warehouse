from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MarketplacePlatform(str, Enum):
    AMAZON = "amazon"
    EBAY = "ebay"
    SHOPIFY = "shopify"
    WALMART = "walmart"
    ETSY = "etsy"
    CUSTOM = "custom"

class OrderStatus(str, Enum):
    PENDING = "pending"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    RETURNED = "returned"
    CANCELLED = "cancelled"

class MappingMethod(str, Enum):
    AUTOMATIC = "automatic"
    MANUAL = "manual"
    AI_SUGGESTED = "ai_suggested"

# Base schemas
class MarketplaceListingBase(BaseModel):
    platform: MarketplacePlatform
    marketplace_sku: str
    listing_id: Optional[str] = None
    status: str = "active"
    price: float
    last_sync: Optional[datetime] = None

class MarketplaceListingCreate(MarketplaceListingBase):
    pass

class MarketplaceListing(MarketplaceListingBase):
    id: str
    product_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    sku: str = Field(..., description="Unique product SKU")
    msku: Optional[str] = Field(None, description="Master SKU")
    name: str = Field(..., description="Product name")
    category: Optional[str] = None
    description: Optional[str] = None
    price: float = Field(..., gt=0, description="Product price")
    cost: Optional[float] = Field(None, ge=0, description="Product cost")
    quantity: int = Field(default=0, ge=0, description="Current quantity")
    reorder_point: int = Field(default=10, ge=0, description="Reorder point")
    supplier: Optional[str] = None

class ProductCreate(ProductBase):
    marketplace_listings: Optional[List[MarketplaceListingCreate]] = []

class Product(ProductBase):
    id: str
    created_at: datetime
    updated_at: datetime
    marketplace_listings: List[MarketplaceListing] = []
    
    class Config:
        from_attributes = True

class SalesRecordBase(BaseModel):
    order_id: str
    marketplace: str
    sku: str
    msku: Optional[str] = None
    product_name: str
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    total_amount: float = Field(..., gt=0)
    fees: float = Field(default=0, ge=0)
    net_amount: float
    order_date: datetime
    status: OrderStatus = OrderStatus.PENDING
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None

class SalesRecordCreate(SalesRecordBase):
    pass

class SalesRecord(SalesRecordBase):
    id: str
    product_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SKUMappingBase(BaseModel):
    original_sku: str
    mapped_sku: str
    msku: Optional[str] = None
    marketplace: str
    confidence: float = Field(..., ge=0, le=1)
    mapping_method: MappingMethod
    notes: Optional[str] = None

class SKUMappingCreate(SKUMappingBase):
    pass

class SKUMapping(SKUMappingBase):
    id: str
    product_id: Optional[str] = None
    created_at: datetime
    validated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class DataProcessingJobBase(BaseModel):
    file_name: str
    file_size: int
    marketplace: str
    status: str = "pending"
    progress: int = 0
    records_processed: int = 0
    records_total: int = 0
    errors: List[str] = []
    warnings: List[str] = []

class DataProcessingJob(DataProcessingJobBase):
    id: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class QueryResultBase(BaseModel):
    query: str
    sql: str
    results: List[Dict[str, Any]]
    execution_time: int

class QueryResult(QueryResultBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AIQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query")

class AIQueryResponse(BaseModel):
    query: str
    sql: str
    results: List[Dict[str, Any]]
    execution_time: int
    visualization_type: Optional[str] = None

class DashboardMetrics(BaseModel):
    total_products: int
    monthly_sales: float
    active_orders: int
    sku_mappings: int
    mapping_accuracy: float
    low_stock_alerts: int

class SalesPerformance(BaseModel):
    period: str
    data: List[Dict[str, Any]]

class MarketplaceDistribution(BaseModel):
    data: List[Dict[str, Any]]