import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from database.models import Product, SalesRecord, SKUMapping, DataProcessingJob
from utils.logger import setup_logger

logger = setup_logger(__name__)

class AnalyticsService:
    """Advanced analytics service for warehouse management insights"""
    
    def __init__(self):
        pass
    
    async def get_dashboard_metrics(self, db: Session) -> Dict:
        """Get key metrics for dashboard"""
        try:
            # Total products
            total_products = db.query(Product).count()
            
            # Monthly sales (current month)
            current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_sales = db.query(func.sum(SalesRecord.total_amount)).filter(
                SalesRecord.order_date >= current_month_start
            ).scalar() or 0
            
            # Active orders (pending + shipped)
            active_orders = db.query(SalesRecord).filter(
                SalesRecord.status.in_(['pending', 'shipped'])
            ).count()
            
            # SKU mappings
            total_mappings = db.query(SKUMapping).count()
            verified_mappings = db.query(SKUMapping).filter(
                SKUMapping.validated_at.isnot(None)
            ).count()
            
            mapping_accuracy = (verified_mappings / total_mappings * 100) if total_mappings > 0 else 0
            
            # Low stock alerts
            low_stock_count = db.query(Product).filter(
                Product.quantity <= Product.reorder_point
            ).count()
            
            # Sales growth (compare with previous month)
            previous_month_start = (current_month_start - timedelta(days=32)).replace(day=1)
            previous_month_end = current_month_start - timedelta(days=1)
            
            previous_monthly_sales = db.query(func.sum(SalesRecord.total_amount)).filter(
                SalesRecord.order_date >= previous_month_start,
                SalesRecord.order_date <= previous_month_end
            ).scalar() or 0
            
            sales_growth = 0
            if previous_monthly_sales > 0:
                sales_growth = ((monthly_sales - previous_monthly_sales) / previous_monthly_sales) * 100
            
            return {
                'total_products': total_products,
                'monthly_sales': round(monthly_sales, 2),
                'sales_growth': round(sales_growth, 1),
                'active_orders': active_orders,
                'sku_mappings': total_mappings,
                'mapping_accuracy': round(mapping_accuracy, 1),
                'low_stock_alerts': low_stock_count
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard metrics: {str(e)}")
            raise
    
    async def get_sales_performance(self, db: Session, period: str = "monthly") -> Dict:
        """Get sales performance data for charts"""
        try:
            if period == "daily":
                date_trunc = 'day'
                interval = '30 days'
            elif period == "weekly":
                date_trunc = 'week'
                interval = '12 weeks'
            else:  # monthly
                date_trunc = 'month'
                interval = '12 months'
            
            query = text(f"""
                SELECT 
                    DATE_TRUNC('{date_trunc}', order_date) as period,
                    SUM(total_amount) as sales,
                    COUNT(*) as orders,
                    SUM(quantity) as units
                FROM sales_records
                WHERE order_date >= CURRENT_DATE - INTERVAL '{interval}'
                GROUP BY DATE_TRUNC('{date_trunc}', order_date)
                ORDER BY period
            """)
            
            result = db.execute(query)
            data = []
            
            for row in result:
                data.append({
                    'period': row.period.strftime('%Y-%m-%d' if period == 'daily' else '%Y-%m'),
                    'sales': float(row.sales or 0),
                    'orders': int(row.orders or 0),
                    'units': int(row.units or 0)
                })
            
            return {
                'period': period,
                'data': data
            }
            
        except Exception as e:
            logger.error(f"Error getting sales performance: {str(e)}")
            raise
    
    async def get_marketplace_distribution(self, db: Session) -> Dict:
        """Get marketplace sales distribution"""
        try:
            # Last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            query = text("""
                SELECT 
                    marketplace,
                    SUM(total_amount) as revenue,
                    COUNT(*) as orders,
                    SUM(quantity) as units_sold,
                    AVG(total_amount) as avg_order_value
                FROM sales_records
                WHERE order_date >= :start_date
                GROUP BY marketplace
                ORDER BY revenue DESC
            """)
            
            result = db.execute(query, {'start_date': thirty_days_ago})
            data = []
            total_revenue = 0
            
            for row in result:
                revenue = float(row.revenue or 0)
                total_revenue += revenue
                
                data.append({
                    'marketplace': row.marketplace,
                    'revenue': revenue,
                    'orders': int(row.orders or 0),
                    'units_sold': int(row.units_sold or 0),
                    'avg_order_value': float(row.avg_order_value or 0)
                })
            
            # Calculate percentages
            for item in data:
                item['percentage'] = (item['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
            
            return {
                'data': data,
                'total_revenue': total_revenue
            }
            
        except Exception as e:
            logger.error(f"Error getting marketplace distribution: {str(e)}")
            raise
    
    async def get_product_performance(self, db: Session, limit: int = 20) -> Dict:
        """Get top performing products"""
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            query = text("""
                SELECT 
                    p.name,
                    p.sku,
                    p.category,
                    SUM(s.quantity) as units_sold,
                    SUM(s.total_amount) as revenue,
                    COUNT(DISTINCT s.order_id) as unique_orders,
                    AVG(s.unit_price) as avg_price
                FROM products p
                JOIN sales_records s ON (p.sku = s.sku OR p.msku = s.msku)
                WHERE s.order_date >= :start_date
                GROUP BY p.id, p.name, p.sku, p.category
                ORDER BY revenue DESC
                LIMIT :limit
            """)
            
            result = db.execute(query, {'start_date': thirty_days_ago, 'limit': limit})
            data = []
            
            for row in result:
                data.append({
                    'name': row.name,
                    'sku': row.sku,
                    'category': row.category or 'Uncategorized',
                    'units_sold': int(row.units_sold or 0),
                    'revenue': float(row.revenue or 0),
                    'unique_orders': int(row.unique_orders or 0),
                    'avg_price': float(row.avg_price or 0)
                })
            
            return {
                'data': data,
                'period': '30 days'
            }
            
        except Exception as e:
            logger.error(f"Error getting product performance: {str(e)}")
            raise
    
    async def get_inventory_insights(self, db: Session) -> Dict:
        """Get inventory management insights"""
        try:
            # Low stock products
            low_stock = db.query(Product).filter(
                Product.quantity <= Product.reorder_point
            ).order_by(Product.quantity.asc()).limit(10).all()
            
            # Overstocked products (quantity > 5x reorder point)
            overstocked = db.query(Product).filter(
                Product.quantity > Product.reorder_point * 5
            ).order_by(Product.quantity.desc()).limit(10).all()
            
            # Zero stock products
            zero_stock = db.query(Product).filter(Product.quantity == 0).count()
            
            # Total inventory value
            inventory_value = db.query(
                func.sum(Product.quantity * Product.cost)
            ).filter(Product.cost.isnot(None)).scalar() or 0
            
            return {
                'low_stock_products': [
                    {
                        'name': p.name,
                        'sku': p.sku,
                        'quantity': p.quantity,
                        'reorder_point': p.reorder_point,
                        'stock_ratio': p.quantity / p.reorder_point if p.reorder_point > 0 else 0
                    }
                    for p in low_stock
                ],
                'overstocked_products': [
                    {
                        'name': p.name,
                        'sku': p.sku,
                        'quantity': p.quantity,
                        'reorder_point': p.reorder_point,
                        'excess_ratio': p.quantity / p.reorder_point if p.reorder_point > 0 else 0
                    }
                    for p in overstocked
                ],
                'zero_stock_count': zero_stock,
                'total_inventory_value': float(inventory_value)
            }
            
        except Exception as e:
            logger.error(f"Error getting inventory insights: {str(e)}")
            raise
    
    async def get_mapping_analytics(self, db: Session) -> Dict:
        """Get SKU mapping analytics"""
        try:
            # Total mappings by marketplace
            marketplace_mappings = db.query(
                SKUMapping.marketplace,
                func.count(SKUMapping.id).label('count'),
                func.avg(SKUMapping.confidence).label('avg_confidence')
            ).group_by(SKUMapping.marketplace).all()
            
            # Mapping method distribution
            method_distribution = db.query(
                SKUMapping.mapping_method,
                func.count(SKUMapping.id).label('count')
            ).group_by(SKUMapping.mapping_method).all()
            
            # Recent mapping activity (last 7 days)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            recent_mappings = db.query(SKUMapping).filter(
                SKUMapping.created_at >= seven_days_ago
            ).count()
            
            # Validation rate
            total_mappings = db.query(SKUMapping).count()
            validated_mappings = db.query(SKUMapping).filter(
                SKUMapping.validated_at.isnot(None)
            ).count()
            
            validation_rate = (validated_mappings / total_mappings * 100) if total_mappings > 0 else 0
            
            return {
                'marketplace_breakdown': [
                    {
                        'marketplace': row.marketplace,
                        'count': row.count,
                        'avg_confidence': float(row.avg_confidence or 0)
                    }
                    for row in marketplace_mappings
                ],
                'method_distribution': [
                    {
                        'method': row.mapping_method,
                        'count': row.count
                    }
                    for row in method_distribution
                ],
                'recent_mappings': recent_mappings,
                'validation_rate': round(validation_rate, 1),
                'total_mappings': total_mappings
            }
            
        except Exception as e:
            logger.error(f"Error getting mapping analytics: {str(e)}")
            raise
    
    async def get_processing_analytics(self, db: Session) -> Dict:
        """Get data processing analytics"""
        try:
            # Processing jobs in last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            jobs = db.query(DataProcessingJob).filter(
                DataProcessingJob.created_at >= thirty_days_ago
            ).all()
            
            total_jobs = len(jobs)
            completed_jobs = len([j for j in jobs if j.status == 'completed'])
            failed_jobs = len([j for j in jobs if j.status == 'failed'])
            total_records = sum(j.records_processed for j in jobs)
            
            # Success rate by marketplace
            marketplace_stats = {}
            for job in jobs:
                if job.marketplace not in marketplace_stats:
                    marketplace_stats[job.marketplace] = {
                        'total': 0,
                        'completed': 0,
                        'records': 0
                    }
                
                marketplace_stats[job.marketplace]['total'] += 1
                marketplace_stats[job.marketplace]['records'] += job.records_processed
                
                if job.status == 'completed':
                    marketplace_stats[job.marketplace]['completed'] += 1
            
            # Calculate success rates
            for marketplace, stats in marketplace_stats.items():
                stats['success_rate'] = (stats['completed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            
            return {
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'failed_jobs': failed_jobs,
                'success_rate': (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0,
                'total_records_processed': total_records,
                'marketplace_performance': [
                    {
                        'marketplace': marketplace,
                        'jobs': stats['total'],
                        'success_rate': round(stats['success_rate'], 1),
                        'records_processed': stats['records']
                    }
                    for marketplace, stats in marketplace_stats.items()
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting processing analytics: {str(e)}")
            raise