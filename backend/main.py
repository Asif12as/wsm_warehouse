from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
import os
from datetime import datetime
import json

from database.connection import get_db, engine
from database import models
from services.sku_mapper import SKUMapperService
from services.data_processor import DataProcessorService
from services.ai_query import AIQueryService
from services.analytics import AnalyticsService
from schemas import schemas
from utils.logger import setup_logger

# Initialize logging
logger = setup_logger(__name__)

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Warehouse Management System API",
    description="Comprehensive WMS backend with intelligent SKU mapping and data processing",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
sku_mapper_service = SKUMapperService()
data_processor_service = DataProcessorService()
ai_query_service = AIQueryService()
analytics_service = AnalyticsService()

@app.get("/")
async def root():
    return {"message": "Warehouse Management System API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Product Management Endpoints
@app.get("/api/products", response_model=List[schemas.Product])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    marketplace: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all products with optional filtering"""
    try:
        query = db.query(models.Product)
        
        if search:
            query = query.filter(
                models.Product.name.ilike(f"%{search}%") |
                models.Product.sku.ilike(f"%{search}%") |
                models.Product.msku.ilike(f"%{search}%")
            )
        
        if marketplace:
            query = query.join(models.MarketplaceListing).filter(
                models.MarketplaceListing.platform == marketplace
            )
        
        products = query.offset(skip).limit(limit).all()
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/products", response_model=schemas.Product)
async def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product"""
    try:
        db_product = models.Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        
        logger.info(f"Created product: {db_product.sku}")
        return db_product
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create product")

# SKU Mapping Endpoints
@app.get("/api/sku-mappings", response_model=List[schemas.SKUMapping])
async def get_sku_mappings(
    skip: int = 0,
    limit: int = 100,
    marketplace: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get SKU mappings with optional filtering"""
    try:
        query = db.query(models.SKUMapping)
        
        if marketplace:
            query = query.filter(models.SKUMapping.marketplace == marketplace)
        
        if status:
            if status == "verified":
                query = query.filter(models.SKUMapping.validated_at.isnot(None))
            elif status == "pending":
                query = query.filter(
                    models.SKUMapping.validated_at.is_(None),
                    models.SKUMapping.confidence >= 0.6
                )
            elif status == "failed":
                query = query.filter(models.SKUMapping.confidence < 0.6)
        
        mappings = query.offset(skip).limit(limit).all()
        return mappings
    except Exception as e:
        logger.error(f"Error fetching SKU mappings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/sku-mappings/validate/{mapping_id}")
async def validate_sku_mapping(
    mapping_id: str,
    db: Session = Depends(get_db)
):
    """Validate a SKU mapping"""
    try:
        mapping = db.query(models.SKUMapping).filter(models.SKUMapping.id == mapping_id).first()
        if not mapping:
            raise HTTPException(status_code=404, detail="Mapping not found")
        
        mapping.validated_at = datetime.utcnow()
        mapping.confidence = 1.0
        db.commit()
        
        logger.info(f"Validated SKU mapping: {mapping.original_sku}")
        return {"message": "Mapping validated successfully"}
    except Exception as e:
        logger.error(f"Error validating mapping: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate mapping")

# Data Processing Endpoints
@app.post("/api/data-processing/upload")
async def upload_sales_data(
    file: UploadFile = File(...),
    marketplace: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload and process sales data file"""
    try:
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Create processing job
        job = models.DataProcessingJob(
            file_name=file.filename,
            file_size=file.size,
            marketplace=marketplace,
            status="processing"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Process file asynchronously
        result = await data_processor_service.process_file(
            file, marketplace, job.id, db
        )
        
        return {"job_id": job.id, "message": "File processing started"}
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process file")

@app.get("/api/data-processing/jobs/{job_id}")
async def get_processing_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Get processing job status"""
    try:
        job = db.query(models.DataProcessingJob).filter(models.DataProcessingJob.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return job
    except Exception as e:
        logger.error(f"Error fetching job: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/data-processing/jobs")
async def get_processing_jobs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all processing jobs"""
    try:
        jobs = db.query(models.DataProcessingJob).order_by(
            models.DataProcessingJob.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return jobs
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Sales Records Endpoints
@app.get("/api/sales-records", response_model=List[schemas.SalesRecord])
async def get_sales_records(
    skip: int = 0,
    limit: int = 100,
    marketplace: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get sales records with optional filtering"""
    try:
        query = db.query(models.SalesRecord)
        
        if marketplace:
            query = query.filter(models.SalesRecord.marketplace == marketplace)
        
        if start_date:
            query = query.filter(models.SalesRecord.order_date >= start_date)
        
        if end_date:
            query = query.filter(models.SalesRecord.order_date <= end_date)
        
        records = query.order_by(
            models.SalesRecord.order_date.desc()
        ).offset(skip).limit(limit).all()
        
        return records
    except Exception as e:
        logger.error(f"Error fetching sales records: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# AI Query Endpoints
@app.post("/api/ai-query")
async def process_ai_query(
    query_request: schemas.AIQueryRequest,
    db: Session = Depends(get_db)
):
    """Process natural language query and return SQL + results"""
    try:
        result = await ai_query_service.process_query(
            query_request.query, db
        )
        
        # Store query result
        query_result = models.QueryResult(
            query=query_request.query,
            sql=result["sql"],
            results=json.dumps(result["results"]),
            execution_time=result["execution_time"]
        )
        db.add(query_result)
        db.commit()
        
        return result
    except Exception as e:
        logger.error(f"Error processing AI query: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process query")

@app.get("/api/ai-query/history")
async def get_query_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get query history"""
    try:
        queries = db.query(models.QueryResult).order_by(
            models.QueryResult.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return queries
    except Exception as e:
        logger.error(f"Error fetching query history: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Analytics Endpoints
@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics(db: Session = Depends(get_db)):
    """Get dashboard analytics data"""
    try:
        analytics = await analytics_service.get_dashboard_metrics(db)
        return analytics
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/analytics/sales-performance")
async def get_sales_performance(
    period: str = "monthly",
    db: Session = Depends(get_db)
):
    """Get sales performance analytics"""
    try:
        performance = await analytics_service.get_sales_performance(db, period)
        return performance
    except Exception as e:
        logger.error(f"Error fetching sales performance: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/analytics/marketplace-distribution")
async def get_marketplace_distribution(db: Session = Depends(get_db)):
    """Get marketplace distribution analytics"""
    try:
        distribution = await analytics_service.get_marketplace_distribution(db)
        return distribution
    except Exception as e:
        logger.error(f"Error fetching marketplace distribution: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)