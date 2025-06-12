from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String, unique=True, nullable=False, index=True)
    msku = Column(String, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    description = Column(Text)
    price = Column(Float, nullable=False)
    cost = Column(Float)
    quantity = Column(Integer, default=0)
    reorder_point = Column(Integer, default=10)
    supplier = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    marketplace_listings = relationship("MarketplaceListing", back_populates="product")
    sales_records = relationship("SalesRecord", back_populates="product")
    sku_mappings = relationship("SKUMapping", back_populates="product")

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    platform = Column(String, nullable=False)  # amazon, ebay, shopify, etc.
    marketplace_sku = Column(String, nullable=False)
    listing_id = Column(String)
    status = Column(String, default="active")  # active, inactive, pending
    price = Column(Float, nullable=False)
    last_sync = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="marketplace_listings")

class SalesRecord(Base):
    __tablename__ = "sales_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, nullable=False, index=True)
    marketplace = Column(String, nullable=False)
    sku = Column(String, nullable=False)
    msku = Column(String)
    product_id = Column(String, ForeignKey("products.id"))
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    fees = Column(Float, default=0)
    net_amount = Column(Float, nullable=False)
    order_date = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # pending, shipped, delivered, returned, cancelled
    customer_name = Column(String)
    customer_email = Column(String)
    customer_address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="sales_records")

class SKUMapping(Base):
    __tablename__ = "sku_mappings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_sku = Column(String, nullable=False, index=True)
    mapped_sku = Column(String, nullable=False)
    msku = Column(String)
    product_id = Column(String, ForeignKey("products.id"))
    marketplace = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    mapping_method = Column(String, nullable=False)  # automatic, manual, ai_suggested
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    validated_at = Column(DateTime)
    
    # Relationships
    product = relationship("Product", back_populates="sku_mappings")

class DataProcessingJob(Base):
    __tablename__ = "data_processing_jobs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    marketplace = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(Integer, default=0)
    records_processed = Column(Integer, default=0)
    records_total = Column(Integer, default=0)
    errors = Column(JSON, default=list)
    warnings = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

class QueryResult(Base):
    __tablename__ = "query_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    query = Column(Text, nullable=False)
    sql = Column(Text, nullable=False)
    results = Column(JSON)
    execution_time = Column(Integer)  # milliseconds
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    level = Column(String, nullable=False)  # INFO, WARNING, ERROR, DEBUG
    message = Column(Text, nullable=False)
    module = Column(String)
    function = Column(String)
    user_id = Column(String)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)