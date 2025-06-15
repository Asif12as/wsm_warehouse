import os
import uuid
import pandas as pd
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import time
from pathlib import Path
from loguru import logger

# Import configuration
from config import Config, ALLOWED_EXTENSIONS, UPLOAD_FOLDER, RESULTS_FOLDER

# Initialize Flask app
app = Flask(__name__, static_folder='static')
app.config.from_object(Config)

# Enable CORS
CORS(app)

# Setup logging
logger.add("warehouse_api.log", rotation="10 MB", level="INFO")

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    """Save an uploaded file and return the path"""
    if file and allowed_file(file.filename):
        # Generate a unique filename to avoid collisions
        original_filename = secure_filename(file.filename)
        extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{extension}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Return the file path and original name
        return {
            "success": True,
            "file_path": file_path,
            "original_filename": original_filename,
            "unique_filename": unique_filename
        }
    
    return {"success": False, "error": "Invalid file format"}

# Session storage (in a real app, use a database)
sessions = {}

# API Routes
@app.route('/', methods=['GET'])
def index():
    """Serve the API documentation page"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/api/upload/mapping', methods=['POST'])
def upload_mapping():
    """Upload a SKU mapping file"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    # Generate a session ID if not provided
    session_id = request.form.get('session_id', uuid.uuid4().hex)
    
    # Save the file
    result = save_uploaded_file(file)
    if not result["success"]:
        return jsonify(result), 400
    
    # Store file info in session
    if session_id not in sessions:
        sessions[session_id] = {}
    
    sessions[session_id]["mapping_file"] = result["file_path"]
    sessions[session_id]["mapping_filename"] = result["original_filename"]
    
    logger.info(f"Uploaded mapping file: {result['original_filename']} for session {session_id}")
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "filename": result["original_filename"]
    })

@app.route('/api/upload/sales', methods=['POST'])
def upload_sales():
    """Upload a sales data file"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    # Get session ID
    session_id = request.form.get('session_id')
    if not session_id or session_id not in sessions:
        session_id = uuid.uuid4().hex
        sessions[session_id] = {}
    
    # Save the file
    result = save_uploaded_file(file)
    if not result["success"]:
        return jsonify(result), 400
    
    # Store file info in session
    sessions[session_id]["sales_file"] = result["file_path"]
    sessions[session_id]["sales_filename"] = result["original_filename"]
    
    logger.info(f"Uploaded sales file: {result['original_filename']} for session {session_id}")
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "filename": result["original_filename"]
    })

@app.route('/api/process', methods=['POST'])
def process_data():
    """Process the uploaded files"""
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id or session_id not in sessions:
        return jsonify({"success": False, "error": "Invalid session ID"}), 400
    
    session = sessions[session_id]
    
    # Check if both files are uploaded
    if "mapping_file" not in session or "sales_file" not in session:
        return jsonify({
            "success": False, 
            "error": "Both mapping and sales files must be uploaded"
        }), 400
    
    try:
        # In a real implementation, this would call the SKU mapper code
        # For now, we'll simulate processing with a delay
        logger.info(f"Processing data for session {session_id}")
        
        # Simulate processing time
        time.sleep(2)
        
        # Generate a result file path
        result_filename = f"{uuid.uuid4().hex}_result.csv"
        result_path = os.path.join(RESULTS_FOLDER, result_filename)
        
        # Store result info in session
        session["result_file"] = result_path
        session["processing_complete"] = True
        session["processing_time"] = time.time()
        
        # Return success response
        return jsonify({
            "success": True,
            "message": "Data processing complete",
            "session_id": session_id
        })
        
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/results', methods=['GET'])
def get_results():
    """Get processing results"""
    session_id = request.args.get('session_id')
    
    if not session_id or session_id not in sessions:
        return jsonify({"success": False, "error": "Invalid session ID"}), 400
    
    session = sessions[session_id]
    
    # Check if processing is complete
    if not session.get("processing_complete", False):
        return jsonify({"success": False, "error": "Processing not complete"}), 400
    
    try:
        # In a real implementation, this would return actual processed data
        # For now, we'll return sample data
        sample_data = {
            "columns": ["Order ID", "Date", "Customer", "SKU", "MSKU", "Quantity", "Price", "Marketplace"],
            "data": [
                ["1001", "2023-01-01", "John Doe", "GLD", "APPLE-01", 2, 19.99, "Amazon"],
                ["1002", "2023-01-02", "Jane Smith", "RED-APPLE", "APPLE-02", 1, 15.99, "eBay"],
                ["1003", "2023-01-03", "Bob Johnson", "GRN-APPLE", "APPLE-03", 3, 17.99, "Walmart"]
            ],
            "summary": {
                "total_rows": 3,
                "mapped_count": 3,
                "unmapped_count": 0
            }
        }
        
        return jsonify({
            "success": True,
            "data": sample_data,
            "session_id": session_id
        })
        
    except Exception as e:
        logger.error(f"Error retrieving results: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/export', methods=['GET'])
def export_data():
    """Export processed data"""
    session_id = request.args.get('session_id')
    format_type = request.args.get('format', 'csv')
    
    if not session_id or session_id not in sessions:
        return jsonify({"success": False, "error": "Invalid session ID"}), 400
    
    session = sessions[session_id]
    
    # Check if processing is complete
    if not session.get("processing_complete", False):
        return jsonify({"success": False, "error": "Processing not complete"}), 400
    
    try:
        # In a real implementation, this would export the actual processed data
        # For now, we'll create a sample file
        
        # Create sample data
        data = {
            "Order ID": ["1001", "1002", "1003"],
            "Date": ["2023-01-01", "2023-01-02", "2023-01-03"],
            "Customer": ["John Doe", "Jane Smith", "Bob Johnson"],
            "SKU": ["GLD", "RED-APPLE", "GRN-APPLE"],
            "MSKU": ["APPLE-01", "APPLE-02", "APPLE-03"],
            "Quantity": [2, 1, 3],
            "Price": [19.99, 15.99, 17.99],
            "Marketplace": ["Amazon", "eBay", "Walmart"]
        }
        
        df = pd.DataFrame(data)
        
        # Generate export file
        export_filename = f"processed_data_{int(time.time())}"
        
        if format_type.lower() == 'xlsx':
            export_path = os.path.join(RESULTS_FOLDER, f"{export_filename}.xlsx")
            df.to_excel(export_path, index=False)
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        else:  # Default to CSV
            export_path = os.path.join(RESULTS_FOLDER, f"{export_filename}.csv")
            df.to_csv(export_path, index=False)
            mimetype = 'text/csv'
        
        return send_file(
            export_path,
            mimetype=mimetype,
            as_attachment=True,
            download_name=os.path.basename(export_path)
        )
        
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/ai-query', methods=['POST'])
def ai_query():
    """Process natural language query and convert to SQL"""
    data = request.json
    query_text = data.get('query')
    session_id = data.get('session_id')
    
    if not query_text:
        return jsonify({"success": False, "error": "No query provided"}), 400
    
    try:
        # For now, we'll use a simple mapping of common queries to SQL
        # In a production environment, you would use a more sophisticated NLP-to-SQL model
        sql_query = generate_sql_from_text(query_text)
        
        # Execute the SQL query (simulated for now)
        result = execute_sql_query(sql_query, session_id)
        
        return jsonify({
            "success": True,
            "query": query_text,
            "sql": sql_query,
            "result": result,
            "session_id": session_id
        })
        
    except Exception as e:
        logger.error(f"Error processing AI query: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# Helper functions for AI Query
def generate_sql_from_text(query_text):
    """Convert natural language query to SQL"""
    # This is a simple implementation - in production, use a proper NLP-to-SQL model
    query_text = query_text.lower()
    
    # Simple mapping of common queries
    if "top" in query_text and "selling" in query_text and "products" in query_text:
        return "SELECT product_name, marketplace, SUM(quantity) as total_sold, SUM(total_amount) as revenue FROM sales_records GROUP BY product_name, marketplace ORDER BY total_sold DESC LIMIT 5"
    
    elif "revenue by marketplace" in query_text:
        return "SELECT marketplace, SUM(total_amount) as revenue FROM sales_records GROUP BY marketplace ORDER BY revenue DESC"
    
    elif "low stock" in query_text:
        return "SELECT product_name, SUM(quantity) as available_stock FROM inventory GROUP BY product_name HAVING available_stock < 10 ORDER BY available_stock ASC"
    
    elif "return rates" in query_text:
        return "SELECT category, COUNT(return_id) as return_count, COUNT(order_id) as order_count, (COUNT(return_id) * 100.0 / COUNT(order_id)) as return_rate FROM orders JOIN returns ON orders.order_id = returns.order_id GROUP BY category ORDER BY return_rate DESC"
    
    elif "profit margins" in query_text:
        return "SELECT product_name, AVG((sale_price - cost_price) / sale_price * 100) as profit_margin FROM products GROUP BY product_name ORDER BY profit_margin DESC LIMIT 10"
    
    elif "compare sales" in query_text and "categories" in query_text:
        return "SELECT category, SUM(quantity) as units_sold, SUM(total_amount) as revenue FROM sales_records GROUP BY category ORDER BY revenue DESC"
    
    # Default query if no match
    return "SELECT * FROM sales_records LIMIT 10"

def execute_sql_query(sql_query, session_id=None):
    """Execute SQL query and return results"""
    # In a real implementation, this would execute the SQL against your database
    # For now, we'll return sample data based on the query
    
    if "product_name" in sql_query and "total_sold" in sql_query:
        # Sample data for top selling products
        return {
            "columns": ["product_name", "marketplace", "total_sold", "revenue"],
            "data": [
                ["Product A", "Amazon", 1250, 24999.50],
                ["Product B", "eBay", 870, 17400.00],
                ["Product C", "Walmart", 650, 13000.00],
                ["Product D", "Amazon", 520, 10400.00],
                ["Product E", "Shopify", 480, 9600.00]
            ],
            "chart_type": "bar",
            "chart_options": {
                "x_axis": "product_name",
                "y_axis": "total_sold",
                "series": "marketplace"
            }
        }
    
    elif "marketplace" in sql_query and "revenue" in sql_query:
        # Sample data for revenue by marketplace
        return {
            "columns": ["marketplace", "revenue"],
            "data": [
                ["Amazon", 125000.00],
                ["eBay", 87500.00],
                ["Walmart", 65000.00],
                ["Shopify", 45000.00],
                ["Etsy", 32500.00]
            ],
            "chart_type": "pie",
            "chart_options": {
                "labels": "marketplace",
                "values": "revenue"
            }
        }
    
    elif "available_stock" in sql_query:
        # Sample data for low stock products
        return {
            "columns": ["product_name", "available_stock"],
            "data": [
                ["Product X", 3],
                ["Product Y", 5],
                ["Product Z", 7],
                ["Product W", 8],
                ["Product V", 9]
            ],
            "chart_type": "bar",
            "chart_options": {
                "x_axis": "product_name",
                "y_axis": "available_stock"
            }
        }
    
    elif "return_rate" in sql_query:
        # Sample data for return rates
        return {
            "columns": ["category", "return_count", "order_count", "return_rate"],
            "data": [
                ["Electronics", 120, 1500, 8.0],
                ["Clothing", 200, 3000, 6.67],
                ["Home Goods", 80, 1200, 6.67],
                ["Toys", 50, 800, 6.25],
                ["Books", 30, 1000, 3.0]
            ],
            "chart_type": "bar",
            "chart_options": {
                "x_axis": "category",
                "y_axis": "return_rate"
            }
        }
    
    elif "profit_margin" in sql_query:
        # Sample data for profit margins
        return {
            "columns": ["product_name", "profit_margin"],
            "data": [
                ["Premium Product", 65.5],
                ["Luxury Item", 58.2],
                ["High-End Model", 52.7],
                ["Quality Brand", 48.9],
                ["Standard Option", 35.4]
            ],
            "chart_type": "bar",
            "chart_options": {
                "x_axis": "product_name",
                "y_axis": "profit_margin"
            }
        }
    
    elif "category" in sql_query and "units_sold" in sql_query:
        # Sample data for sales comparison by category
        return {
            "columns": ["category", "units_sold", "revenue"],
            "data": [
                ["Electronics", 3500, 175000.00],
                ["Clothing", 5200, 104000.00],
                ["Home Goods", 2800, 84000.00],
                ["Toys", 1900, 57000.00],
                ["Books", 4100, 41000.00]
            ],
            "chart_type": "bar",
            "chart_options": {
                "x_axis": "category",
                "y_axis": ["units_sold", "revenue"],
                "multi_axis": True
            }
        }
    
    # Default sample data
    return {
        "columns": ["order_id", "date", "customer", "product", "quantity", "total_amount", "marketplace"],
        "data": [
            ["1001", "2023-05-01", "Customer A", "Product X", 2, 39.98, "Amazon"],
            ["1002", "2023-05-02", "Customer B", "Product Y", 1, 25.99, "eBay"],
            ["1003", "2023-05-03", "Customer C", "Product Z", 3, 59.97, "Walmart"],
            ["1004", "2023-05-04", "Customer D", "Product X", 1, 19.99, "Amazon"],
            ["1005", "2023-05-05", "Customer E", "Product W", 2, 45.98, "Shopify"]
        ],
        "chart_type": "table"
    }

# Main entry point
if __name__ == '__main__':
    # Create necessary directories
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(RESULTS_FOLDER, exist_ok=True)
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)