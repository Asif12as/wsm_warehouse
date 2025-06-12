# WMS Backend

Comprehensive backend system for the Warehouse Management System with intelligent SKU mapping, data processing, and AI-powered analytics.

## Features

- **Intelligent SKU Mapping**: Automatic product identification across multiple marketplaces
- **Data Processing**: Robust file processing for sales data from various platforms
- **AI Query Interface**: Natural language to SQL query processing
- **Advanced Analytics**: Comprehensive business intelligence and reporting
- **RESTful API**: Full-featured API for frontend integration
- **Database Management**: Flexible PostgreSQL/SQLite database architecture

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL (or SQLite for development)
- pip

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:
```bash
# For PostgreSQL
alembic upgrade head

# For SQLite (development)
export DATABASE_URL="sqlite:///./wms.db"
python -c "from database.models import Base; from database.connection import engine; Base.metadata.create_all(bind=engine)"
```

4. Run the server:
```bash
python run.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Architecture

### Core Services

- **SKUMapperService**: Intelligent product identification and mapping
- **DataProcessorService**: File processing and data integration
- **AIQueryService**: Natural language query processing
- **AnalyticsService**: Business intelligence and reporting

### Database Models

- **Product**: Product catalog with inventory information
- **SalesRecord**: Sales transactions from all marketplaces
- **SKUMapping**: Product identification mappings
- **MarketplaceListing**: Platform-specific product listings
- **DataProcessingJob**: File processing job tracking

## Configuration

### Environment Variables

- `DATABASE_URL`: Database connection string
- `ENVIRONMENT`: development/production
- `DEBUG`: Enable debug mode
- `SECRET_KEY`: Application secret key
- `CORS_ORIGINS`: Allowed CORS origins

### Database Setup

#### PostgreSQL (Production)
```bash
# Create database
createdb wms_db

# Set environment
export DATABASE_URL="postgresql://user:password@localhost:5432/wms_db"

# Run migrations
alembic upgrade head
```

#### SQLite (Development)
```bash
# Set environment
export DATABASE_URL="sqlite:///./wms.db"

# Create tables
python -c "from database.models import Base; from database.connection import engine; Base.metadata.create_all(bind=engine)"
```

## Usage Examples

### Upload Sales Data
```python
import requests

files = {'file': open('sales_data.csv', 'rb')}
data = {'marketplace': 'amazon'}

response = requests.post(
    'http://localhost:8000/api/data-processing/upload',
    files=files,
    data=data
)
```

### AI Query
```python
import requests

query = {
    "query": "Show me the top 5 selling products this month"
}

response = requests.post(
    'http://localhost:8000/api/ai-query',
    json=query
)
```

## Development

### Running Tests
```bash
pytest tests/
```

### Code Quality
```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

### Docker
```bash
# Build image
docker build -t wms-backend .

# Run container
docker run -p 8000:8000 -e DATABASE_URL="your-db-url" wms-backend
```

### Production Considerations

- Use PostgreSQL for production database
- Set up proper logging and monitoring
- Configure CORS for your frontend domain
- Use environment variables for sensitive configuration
- Set up database backups
- Configure SSL/TLS termination

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Ensure database server is running
   - Verify credentials and permissions

2. **File Processing Errors**
   - Check file format (CSV/Excel supported)
   - Verify column mappings for marketplace
   - Review error logs for specific issues

3. **SKU Mapping Issues**
   - Check SKU format validation
   - Review marketplace-specific rules
   - Verify product data integrity

## Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review logs in the `logs/` directory
3. Check database integrity with provided utilities