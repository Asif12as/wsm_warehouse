import pandas as pd
import numpy as np
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import io
import asyncio
from sqlalchemy.orm import Session
from fastapi import UploadFile

from database.models import SalesRecord, Product, DataProcessingJob, SKUMapping
from services.sku_mapper import SKUMapperService
from utils.logger import setup_logger

logger = setup_logger(__name__)

class DataProcessorService:
    """Comprehensive data processing service for sales data from multiple marketplaces"""
    
    def __init__(self):
        self.sku_mapper = SKUMapperService()
        self.supported_formats = ['.csv', '.xlsx', '.xls']
        
        # Marketplace-specific column mappings
        self.column_mappings = {
            'amazon': {
                'order_id': ['order-id', 'Order ID', 'OrderId', 'order_id', 'Amazon Order ID'],
                'sku': ['sku', 'SKU', 'ASIN', 'Product SKU', 'Item SKU'],
                'product_name': ['product-name', 'Product Name', 'Title', 'Item Name'],
                'quantity': ['quantity', 'Quantity', 'Qty', 'Quantity Purchased'],
                'unit_price': ['unit-price', 'Unit Price', 'Price', 'Item Price'],
                'total_amount': ['total', 'Total', 'Amount', 'Order Total'],
                'fees': ['fees', 'Fees', 'Amazon Fee', 'Referral Fee', 'Commission'],
                'order_date': ['order-date', 'Order Date', 'Purchase Date', 'Date'],
                'status': ['status', 'Status', 'Order Status', 'Fulfillment Status']
            },
            'ebay': {
                'order_id': ['Sales Record Number', 'Order ID', 'Transaction ID'],
                'sku': ['Item ID', 'Custom Label', 'SKU', 'Product ID'],
                'product_name': ['Title', 'Item Title', 'Product Name'],
                'quantity': ['Quantity', 'Qty', 'Quantity Sold'],
                'unit_price': ['Price', 'Sale Price', 'Unit Price'],
                'total_amount': ['Total', 'Sale Amount', 'Total Price'],
                'fees': ['eBay Fee', 'Final Value Fee', 'Fees'],
                'order_date': ['Sale Date', 'Order Date', 'Transaction Date'],
                'status': ['Order Status', 'Status']
            },
            'shopify': {
                'order_id': ['Name', 'Order', 'Order Number', 'Order ID'],
                'sku': ['SKU', 'Variant SKU', 'Product SKU'],
                'product_name': ['Name', 'Product Name', 'Title'],
                'quantity': ['Quantity', 'Qty'],
                'unit_price': ['Price', 'Unit Price', 'Product Price'],
                'total_amount': ['Total', 'Line Total', 'Amount'],
                'fees': ['Fees', 'Transaction Fee', 'Payment Fee'],
                'order_date': ['Created at', 'Order Date', 'Date'],
                'status': ['Fulfillment Status', 'Status', 'Order Status']
            },
            'walmart': {
                'order_id': ['Purchase Order', 'PO Number', 'Order ID'],
                'sku': ['SKU', 'Product SKU', 'Item SKU', 'WM SKU'],
                'product_name': ['Product Name', 'Item Name', 'Title'],
                'quantity': ['Quantity', 'Qty', 'Units'],
                'unit_price': ['Unit Price', 'Price', 'Item Price'],
                'total_amount': ['Total', 'Amount', 'Line Total'],
                'fees': ['Commission', 'Walmart Fee', 'Fees'],
                'order_date': ['Order Date', 'Date', 'Purchase Date'],
                'status': ['Status', 'Order Status', 'Fulfillment Status']
            }
        }
    
    async def process_file(self, file: UploadFile, marketplace: str, job_id: str, db: Session) -> Dict:
        """Process uploaded sales data file"""
        try:
            logger.info(f"Starting file processing: {file.filename} for {marketplace}")
            
            # Update job status
            job = db.query(DataProcessingJob).filter(DataProcessingJob.id == job_id).first()
            if not job:
                raise Exception("Processing job not found")
            
            job.status = "processing"
            db.commit()
            
            # Read file content
            content = await file.read()
            df = await self._read_file_content(content, file.filename)
            
            job.records_total = len(df)
            db.commit()
            
            # Process data
            processed_records = []
            errors = []
            warnings = []
            
            for index, row in df.iterrows():
                try:
                    # Map columns to standard format
                    mapped_data = self._map_columns(row.to_dict(), marketplace)
                    
                    # Validate required fields
                    validation_result = self._validate_record(mapped_data)
                    if not validation_result['valid']:
                        errors.extend([f"Row {index + 1}: {error}" for error in validation_result['errors']])
                        continue
                    
                    # Process SKU mapping
                    sku_mapping = self.sku_mapper.map_sku(mapped_data['sku'], marketplace, db)
                    
                    # Create sales record
                    sales_record = self._create_sales_record(mapped_data, sku_mapping, marketplace)
                    processed_records.append(sales_record)
                    
                    # Update progress
                    job.records_processed = index + 1
                    job.progress = int((index + 1) / len(df) * 100)
                    
                    if index % 10 == 0:  # Update every 10 records
                        db.commit()
                    
                except Exception as e:
                    error_msg = f"Row {index + 1}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg)
            
            # Save processed records to database
            await self._save_records_to_db(processed_records, db)
            
            # Update job completion
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress = 100
            job.errors = errors
            job.warnings = warnings
            db.commit()
            
            result = {
                'job_id': job_id,
                'records_processed': len(processed_records),
                'records_total': len(df),
                'errors': errors,
                'warnings': warnings,
                'success_rate': len(processed_records) / len(df) if len(df) > 0 else 0
            }
            
            logger.info(f"File processing completed: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}")
            
            # Update job with error status
            if 'job' in locals():
                job.status = "failed"
                job.errors = [str(e)]
                db.commit()
            
            raise
    
    async def _read_file_content(self, content: bytes, filename: str) -> pd.DataFrame:
        """Read file content into pandas DataFrame"""
        try:
            if filename.endswith('.csv'):
                # Try different encodings
                for encoding in ['utf-8', 'latin-1', 'cp1252']:
                    try:
                        df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise Exception("Unable to decode CSV file with supported encodings")
            
            elif filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(content))
            
            else:
                raise Exception(f"Unsupported file format: {filename}")
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Remove empty rows
            df = df.dropna(how='all')
            
            logger.info(f"Successfully read file: {len(df)} rows, {len(df.columns)} columns")
            return df
            
        except Exception as e:
            logger.error(f"Error reading file content: {str(e)}")
            raise
    
    def _map_columns(self, row_data: Dict, marketplace: str) -> Dict:
        """Map marketplace-specific columns to standard format"""
        mapped_data = {}
        column_mapping = self.column_mappings.get(marketplace, {})
        
        for standard_field, possible_columns in column_mapping.items():
            value = None
            
            # Find the first matching column
            for col_name in possible_columns:
                if col_name in row_data and pd.notna(row_data[col_name]):
                    value = row_data[col_name]
                    break
            
            mapped_data[standard_field] = value
        
        # Add any unmapped columns as additional data
        mapped_data['raw_data'] = row_data
        
        return mapped_data
    
    def _validate_record(self, record: Dict) -> Dict:
        """Validate required fields in sales record"""
        errors = []
        
        # Required fields
        required_fields = ['order_id', 'sku', 'product_name', 'quantity', 'unit_price']
        
        for field in required_fields:
            if not record.get(field) or pd.isna(record[field]):
                errors.append(f"Missing required field: {field}")
        
        # Validate data types
        try:
            if record.get('quantity'):
                quantity = float(record['quantity'])
                if quantity <= 0:
                    errors.append("Quantity must be greater than 0")
        except (ValueError, TypeError):
            errors.append("Invalid quantity format")
        
        try:
            if record.get('unit_price'):
                price = float(record['unit_price'])
                if price < 0:
                    errors.append("Unit price cannot be negative")
        except (ValueError, TypeError):
            errors.append("Invalid unit price format")
        
        # Validate order date
        if record.get('order_date'):
            try:
                pd.to_datetime(record['order_date'])
            except:
                errors.append("Invalid order date format")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _create_sales_record(self, mapped_data: Dict, sku_mapping: Dict, marketplace: str) -> SalesRecord:
        """Create SalesRecord object from mapped data"""
        # Calculate derived fields
        quantity = int(float(mapped_data.get('quantity', 1)))
        unit_price = float(mapped_data.get('unit_price', 0))
        total_amount = float(mapped_data.get('total_amount', 0))
        fees = float(mapped_data.get('fees', 0))
        
        # Calculate total if not provided
        if not total_amount and unit_price and quantity:
            total_amount = unit_price * quantity
        
        # Calculate net amount
        net_amount = total_amount - fees
        
        # Parse order date
        order_date = datetime.utcnow()
        if mapped_data.get('order_date'):
            try:
                order_date = pd.to_datetime(mapped_data['order_date']).to_pydatetime()
            except:
                pass
        
        sales_record = SalesRecord(
            order_id=str(mapped_data['order_id']),
            marketplace=marketplace,
            sku=sku_mapping['original_sku'],
            msku=sku_mapping.get('msku'),
            product_id=sku_mapping.get('product_id'),
            product_name=str(mapped_data['product_name']),
            quantity=quantity,
            unit_price=unit_price,
            total_amount=total_amount,
            fees=fees,
            net_amount=net_amount,
            order_date=order_date,
            status=mapped_data.get('status', 'pending'),
            customer_name=mapped_data.get('customer_name'),
            customer_email=mapped_data.get('customer_email'),
            customer_address=mapped_data.get('customer_address')
        )
        
        return sales_record
    
    async def _save_records_to_db(self, records: List[SalesRecord], db: Session):
        """Save processed records to database"""
        try:
            # Save in batches for better performance
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                db.add_all(batch)
                db.commit()
                
                # Small delay to prevent overwhelming the database
                await asyncio.sleep(0.01)
            
            logger.info(f"Successfully saved {len(records)} records to database")
            
        except Exception as e:
            logger.error(f"Error saving records to database: {str(e)}")
            db.rollback()
            raise
    
    def get_processing_statistics(self, db: Session, days: int = 30) -> Dict:
        """Get data processing statistics"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            jobs = db.query(DataProcessingJob).filter(
                DataProcessingJob.created_at >= start_date
            ).all()
            
            total_jobs = len(jobs)
            completed_jobs = len([j for j in jobs if j.status == 'completed'])
            failed_jobs = len([j for j in jobs if j.status == 'failed'])
            total_records = sum(j.records_processed for j in jobs)
            
            marketplace_stats = {}
            for job in jobs:
                if job.marketplace not in marketplace_stats:
                    marketplace_stats[job.marketplace] = {
                        'jobs': 0,
                        'records': 0,
                        'success_rate': 0
                    }
                marketplace_stats[job.marketplace]['jobs'] += 1
                marketplace_stats[job.marketplace]['records'] += job.records_processed
            
            return {
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'failed_jobs': failed_jobs,
                'success_rate': completed_jobs / total_jobs if total_jobs > 0 else 0,
                'total_records_processed': total_records,
                'marketplace_breakdown': marketplace_stats,
                'period_days': days
            }
            
        except Exception as e:
            logger.error(f"Error getting processing statistics: {str(e)}")
            raise
    
    def cleanup_old_jobs(self, db: Session, days: int = 90):
        """Clean up old processing jobs"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            old_jobs = db.query(DataProcessingJob).filter(
                DataProcessingJob.created_at < cutoff_date,
                DataProcessingJob.status.in_(['completed', 'failed'])
            ).all()
            
            for job in old_jobs:
                db.delete(job)
            
            db.commit()
            logger.info(f"Cleaned up {len(old_jobs)} old processing jobs")
            
        except Exception as e:
            logger.error(f"Error cleaning up old jobs: {str(e)}")
            db.rollback()
            raise