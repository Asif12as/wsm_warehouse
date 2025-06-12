import re
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import time
from sqlalchemy.orm import Session
from sqlalchemy import text

from utils.logger import setup_logger

logger = setup_logger(__name__)

class AIQueryService:
    """AI-powered natural language to SQL query service"""
    
    def __init__(self):
        self.table_schemas = {
            'products': {
                'columns': ['id', 'sku', 'msku', 'name', 'category', 'price', 'cost', 'quantity', 'reorder_point', 'supplier', 'created_at', 'updated_at'],
                'description': 'Product catalog with inventory information'
            },
            'sales_records': {
                'columns': ['id', 'order_id', 'marketplace', 'sku', 'msku', 'product_name', 'quantity', 'unit_price', 'total_amount', 'fees', 'net_amount', 'order_date', 'status', 'customer_name'],
                'description': 'Sales transactions from all marketplaces'
            },
            'sku_mappings': {
                'columns': ['id', 'original_sku', 'mapped_sku', 'msku', 'marketplace', 'confidence', 'mapping_method', 'created_at', 'validated_at'],
                'description': 'SKU mapping relationships between marketplaces and internal system'
            },
            'marketplace_listings': {
                'columns': ['id', 'product_id', 'platform', 'marketplace_sku', 'listing_id', 'status', 'price', 'last_sync'],
                'description': 'Product listings across different marketplaces'
            }
        }
        
        self.query_patterns = {
            'top_selling': {
                'keywords': ['top', 'best', 'selling', 'popular', 'highest'],
                'template': self._generate_top_selling_query
            },
            'revenue': {
                'keywords': ['revenue', 'sales', 'income', 'earnings', 'total'],
                'template': self._generate_revenue_query
            },
            'low_stock': {
                'keywords': ['low', 'stock', 'inventory', 'reorder', 'shortage'],
                'template': self._generate_low_stock_query
            },
            'marketplace_performance': {
                'keywords': ['marketplace', 'platform', 'channel', 'compare'],
                'template': self._generate_marketplace_query
            },
            'product_performance': {
                'keywords': ['product', 'category', 'performance', 'analysis'],
                'template': self._generate_product_performance_query
            },
            'time_series': {
                'keywords': ['trend', 'over time', 'monthly', 'daily', 'weekly'],
                'template': self._generate_time_series_query
            }
        }
    
    async def process_query(self, natural_query: str, db: Session) -> Dict:
        """Process natural language query and return SQL + results"""
        try:
            start_time = time.time()
            logger.info(f"Processing AI query: {natural_query}")
            
            # Analyze query intent
            query_intent = self._analyze_query_intent(natural_query)
            
            # Generate SQL based on intent
            sql_query = self._generate_sql_query(natural_query, query_intent)
            
            # Execute query
            results = self._execute_query(sql_query, db)
            
            # Calculate execution time
            execution_time = int((time.time() - start_time) * 1000)
            
            # Determine visualization type
            visualization_type = self._determine_visualization_type(query_intent, results)
            
            response = {
                'query': natural_query,
                'sql': sql_query,
                'results': results,
                'execution_time': execution_time,
                'visualization_type': visualization_type,
                'row_count': len(results)
            }
            
            logger.info(f"AI query processed successfully: {len(results)} rows returned")
            return response
            
        except Exception as e:
            logger.error(f"Error processing AI query: {str(e)}")
            raise
    
    def _analyze_query_intent(self, query: str) -> Dict:
        """Analyze natural language query to determine intent"""
        query_lower = query.lower()
        intent = {
            'type': 'general',
            'entities': [],
            'time_period': None,
            'aggregation': None,
            'filters': []
        }
        
        # Detect query type
        for pattern_name, pattern_info in self.query_patterns.items():
            if any(keyword in query_lower for keyword in pattern_info['keywords']):
                intent['type'] = pattern_name
                break
        
        # Extract entities
        intent['entities'] = self._extract_entities(query_lower)
        
        # Extract time period
        intent['time_period'] = self._extract_time_period(query_lower)
        
        # Extract aggregation type
        intent['aggregation'] = self._extract_aggregation(query_lower)
        
        # Extract filters
        intent['filters'] = self._extract_filters(query_lower)
        
        return intent
    
    def _extract_entities(self, query: str) -> List[str]:
        """Extract relevant entities from query"""
        entities = []
        
        # Marketplace entities
        marketplaces = ['amazon', 'ebay', 'shopify', 'walmart', 'etsy']
        for marketplace in marketplaces:
            if marketplace in query:
                entities.append(f"marketplace:{marketplace}")
        
        # Product categories (would be enhanced with actual categories from DB)
        categories = ['electronics', 'clothing', 'books', 'home', 'garden', 'toys']
        for category in categories:
            if category in query:
                entities.append(f"category:{category}")
        
        # Status entities
        statuses = ['pending', 'shipped', 'delivered', 'returned', 'cancelled']
        for status in statuses:
            if status in query:
                entities.append(f"status:{status}")
        
        return entities
    
    def _extract_time_period(self, query: str) -> Optional[str]:
        """Extract time period from query"""
        time_patterns = {
            'today': r'\btoday\b',
            'yesterday': r'\byesterday\b',
            'this week': r'\bthis week\b',
            'last week': r'\blast week\b',
            'this month': r'\bthis month\b',
            'last month': r'\blast month\b',
            'this year': r'\bthis year\b',
            'last year': r'\blast year\b',
            '30 days': r'\b30 days?\b|\blast 30 days?\b',
            '7 days': r'\b7 days?\b|\blast 7 days?\b|\bweek\b'
        }
        
        for period, pattern in time_patterns.items():
            if re.search(pattern, query):
                return period
        
        return None
    
    def _extract_aggregation(self, query: str) -> Optional[str]:
        """Extract aggregation type from query"""
        if any(word in query for word in ['sum', 'total', 'revenue', 'sales']):
            return 'sum'
        elif any(word in query for word in ['count', 'number', 'how many']):
            return 'count'
        elif any(word in query for word in ['average', 'avg', 'mean']):
            return 'avg'
        elif any(word in query for word in ['max', 'maximum', 'highest', 'top']):
            return 'max'
        elif any(word in query for word in ['min', 'minimum', 'lowest', 'bottom']):
            return 'min'
        
        return None
    
    def _extract_filters(self, query: str) -> List[Dict]:
        """Extract filter conditions from query"""
        filters = []
        
        # Extract numeric filters
        numeric_patterns = [
            (r'more than (\d+)', 'gt'),
            (r'greater than (\d+)', 'gt'),
            (r'above (\d+)', 'gt'),
            (r'less than (\d+)', 'lt'),
            (r'below (\d+)', 'lt'),
            (r'under (\d+)', 'lt'),
            (r'equal to (\d+)', 'eq'),
            (r'exactly (\d+)', 'eq')
        ]
        
        for pattern, operator in numeric_patterns:
            matches = re.findall(pattern, query)
            if matches:
                filters.append({
                    'type': 'numeric',
                    'operator': operator,
                    'value': int(matches[0])
                })
        
        return filters
    
    def _generate_sql_query(self, natural_query: str, intent: Dict) -> str:
        """Generate SQL query based on intent analysis"""
        query_type = intent['type']
        
        if query_type in self.query_patterns:
            template_func = self.query_patterns[query_type]['template']
            return template_func(natural_query, intent)
        
        # Default general query
        return self._generate_general_query(natural_query, intent)
    
    def _generate_top_selling_query(self, query: str, intent: Dict) -> str:
        """Generate query for top selling products"""
        limit = 5
        time_filter = ""
        
        # Extract limit if specified
        limit_match = re.search(r'top (\d+)', query.lower())
        if limit_match:
            limit = int(limit_match.group(1))
        
        # Add time filter if specified
        if intent['time_period']:
            time_filter = self._get_time_filter('order_date', intent['time_period'])
        
        # Add marketplace filter if specified
        marketplace_filter = ""
        marketplace_entities = [e for e in intent['entities'] if e.startswith('marketplace:')]
        if marketplace_entities:
            marketplace = marketplace_entities[0].split(':')[1]
            marketplace_filter = f"AND marketplace = '{marketplace}'"
        
        sql = f"""
        SELECT 
            p.name,
            p.sku,
            SUM(s.quantity) as total_sold,
            SUM(s.total_amount) as revenue,
            COUNT(s.id) as order_count
        FROM products p
        JOIN sales_records s ON p.sku = s.sku OR p.msku = s.msku
        WHERE 1=1 {time_filter} {marketplace_filter}
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_sold DESC
        LIMIT {limit}
        """
        
        return sql.strip()
    
    def _generate_revenue_query(self, query: str, intent: Dict) -> str:
        """Generate query for revenue analysis"""
        time_filter = ""
        group_by = ""
        
        if intent['time_period']:
            time_filter = self._get_time_filter('order_date', intent['time_period'])
        
        # Check if grouping by marketplace
        if 'marketplace' in query.lower():
            group_by = "GROUP BY marketplace"
            select_fields = "marketplace, SUM(total_amount) as revenue, COUNT(*) as orders"
        else:
            select_fields = "SUM(total_amount) as total_revenue, COUNT(*) as total_orders"
        
        sql = f"""
        SELECT {select_fields}
        FROM sales_records
        WHERE 1=1 {time_filter}
        {group_by}
        ORDER BY revenue DESC
        """
        
        return sql.strip()
    
    def _generate_low_stock_query(self, query: str, intent: Dict) -> str:
        """Generate query for low stock products"""
        sql = """
        SELECT 
            name,
            sku,
            quantity,
            reorder_point,
            (quantity::float / reorder_point) as stock_ratio
        FROM products
        WHERE quantity <= reorder_point
        ORDER BY stock_ratio ASC
        """
        
        return sql.strip()
    
    def _generate_marketplace_query(self, query: str, intent: Dict) -> str:
        """Generate query for marketplace performance"""
        time_filter = ""
        
        if intent['time_period']:
            time_filter = self._get_time_filter('order_date', intent['time_period'])
        
        sql = f"""
        SELECT 
            marketplace,
            SUM(total_amount) as revenue,
            COUNT(*) as orders,
            AVG(total_amount) as avg_order_value,
            SUM(quantity) as units_sold
        FROM sales_records
        WHERE 1=1 {time_filter}
        GROUP BY marketplace
        ORDER BY revenue DESC
        """
        
        return sql.strip()
    
    def _generate_product_performance_query(self, query: str, intent: Dict) -> str:
        """Generate query for product performance analysis"""
        time_filter = ""
        
        if intent['time_period']:
            time_filter = self._get_time_filter('s.order_date', intent['time_period'])
        
        sql = f"""
        SELECT 
            p.name,
            p.category,
            SUM(s.quantity) as units_sold,
            SUM(s.total_amount) as revenue,
            AVG(s.unit_price) as avg_price,
            COUNT(DISTINCT s.order_id) as unique_orders
        FROM products p
        JOIN sales_records s ON p.sku = s.sku OR p.msku = s.msku
        WHERE 1=1 {time_filter}
        GROUP BY p.id, p.name, p.category
        ORDER BY revenue DESC
        LIMIT 20
        """
        
        return sql.strip()
    
    def _generate_time_series_query(self, query: str, intent: Dict) -> str:
        """Generate query for time series analysis"""
        date_trunc = 'day'
        
        if 'month' in query.lower():
            date_trunc = 'month'
        elif 'week' in query.lower():
            date_trunc = 'week'
        
        sql = f"""
        SELECT 
            DATE_TRUNC('{date_trunc}', order_date) as period,
            SUM(total_amount) as revenue,
            COUNT(*) as orders,
            SUM(quantity) as units_sold
        FROM sales_records
        WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('{date_trunc}', order_date)
        ORDER BY period
        """
        
        return sql.strip()
    
    def _generate_general_query(self, query: str, intent: Dict) -> str:
        """Generate general query when specific pattern not matched"""
        # Default to recent sales records
        sql = """
        SELECT 
            order_id,
            marketplace,
            product_name,
            quantity,
            total_amount,
            order_date,
            status
        FROM sales_records
        ORDER BY order_date DESC
        LIMIT 10
        """
        
        return sql.strip()
    
    def _get_time_filter(self, date_column: str, time_period: str) -> str:
        """Generate SQL time filter based on period"""
        filters = {
            'today': f"AND {date_column} >= CURRENT_DATE",
            'yesterday': f"AND {date_column} >= CURRENT_DATE - INTERVAL '1 day' AND {date_column} < CURRENT_DATE",
            'this week': f"AND {date_column} >= DATE_TRUNC('week', CURRENT_DATE)",
            'last week': f"AND {date_column} >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week' AND {date_column} < DATE_TRUNC('week', CURRENT_DATE)",
            'this month': f"AND {date_column} >= DATE_TRUNC('month', CURRENT_DATE)",
            'last month': f"AND {date_column} >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND {date_column} < DATE_TRUNC('month', CURRENT_DATE)",
            'this year': f"AND {date_column} >= DATE_TRUNC('year', CURRENT_DATE)",
            'last year': f"AND {date_column} >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 year' AND {date_column} < DATE_TRUNC('year', CURRENT_DATE)",
            '30 days': f"AND {date_column} >= CURRENT_DATE - INTERVAL '30 days'",
            '7 days': f"AND {date_column} >= CURRENT_DATE - INTERVAL '7 days'"
        }
        
        return filters.get(time_period, "")
    
    def _execute_query(self, sql_query: str, db: Session) -> List[Dict]:
        """Execute SQL query and return results"""
        try:
            result = db.execute(text(sql_query))
            columns = result.keys()
            rows = result.fetchall()
            
            # Convert to list of dictionaries
            results = []
            for row in rows:
                row_dict = {}
                for i, column in enumerate(columns):
                    value = row[i]
                    # Handle datetime serialization
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    row_dict[column] = value
                results.append(row_dict)
            
            return results
            
        except Exception as e:
            logger.error(f"Error executing SQL query: {str(e)}")
            logger.error(f"Query: {sql_query}")
            raise
    
    def _determine_visualization_type(self, intent: Dict, results: List[Dict]) -> str:
        """Determine appropriate visualization type for results"""
        if not results:
            return 'table'
        
        query_type = intent['type']
        result_columns = list(results[0].keys()) if results else []
        
        # Chart types based on query intent and data structure
        if query_type in ['revenue', 'marketplace_performance'] and len(results) > 1:
            return 'chart'
        elif query_type == 'time_series':
            return 'line_chart'
        elif query_type == 'top_selling' and len(results) > 1:
            return 'bar_chart'
        elif len(results) == 1 and len(result_columns) == 1:
            return 'metric'
        else:
            return 'table'
    
    def get_query_suggestions(self, partial_query: str) -> List[str]:
        """Get query suggestions based on partial input"""
        suggestions = [
            "Show me the top 5 selling products this month",
            "What's the total revenue by marketplace?",
            "Find products with low stock levels",
            "Compare sales performance across different categories",
            "Show me return rates by product category",
            "Which products have the highest profit margins?",
            "What are the sales trends over the last 30 days?",
            "Show me Amazon sales for this week",
            "List all pending orders",
            "What's the average order value by marketplace?"
        ]
        
        if partial_query:
            # Filter suggestions based on partial query
            partial_lower = partial_query.lower()
            filtered_suggestions = [
                s for s in suggestions 
                if any(word in s.lower() for word in partial_lower.split())
            ]
            return filtered_suggestions[:5]
        
        return suggestions[:5]