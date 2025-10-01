 # Warehouse Management System

A comprehensive warehouse management system with both a desktop GUI application and a web application for mapping Stock Keeping Units (SKUs) to Master SKUs (MSKUs) and processing sales data.

## Project Overview

This project consists of two main components:

1. **Desktop GUI Application**: A Python application with a graphical user interface for SKU to MSKU mapping and sales data processing.

 ![GUI_1](https://github.com/Asif12as/wsm_warehouse/blob/master/mapping_data.JPG)
 ![GUI_2](https://github.com/Asif12as/wsm_warehouse/blob/master/resultt_sku_msku.JPG)


   
3. **Web Application**: A full-stack web application with a React frontend and Flask backend that provides similar functionality through a web interface.

![Dashboard](https://github.com/Asif12as/wsm_warehouse/blob/master/wsm1.JPG)
![Processed](https://github.com/Asif12as/wsm_warehouse/blob/master/wsm3.JPG)

 
## Key Concepts

- **SKU (Stock Keeping Unit)**: A unique identifier for products that may vary across different marketplaces (e.g., "Golden Apple" and "GLD" for the same product).
- **MSKU (Master SKU)**: The master identifier that consolidates all variations of a product.

## Features

- Load and manage SKU to MSKU mappings
- Process sales data from various marketplaces
- Automatic SKU identification and mapping
- Support for combo products (multiple SKUs per MSKU)
- Flexible input processing for various file formats
- SKU format validation
- Error handling for missing mappings
- Support for multiple marketplace formats
- Logging of the mapping process
- Web interface for remote access and collaboration
- Data visualization and export capabilities

## Project Structure

```
warehouse_wsm/
├── sku_mapper.py           # Desktop GUI application main file
├── requirements.txt        # Python dependencies for desktop app
├── run_app.bat             # Batch file to run the desktop app
├── sample_mapping.csv      # Sample mapping file
├── sample_sales.csv        # Sample sales data file
├── warehouse_web/          # Web application
│   ├── backend/            # Flask backend
│   │   ├── app.py          # Main Flask application
│   │   ├── config.py       # Configuration settings
│   │   ├── requirements.txt # Python dependencies
│   │   ├── run.py          # Entry point for running the server
│   │   ├── run_server.bat  # Batch file to run the server
│   │   ├── sku_mapper_utils.py # Utility functions
│   │   ├── uploads/        # Directory for uploaded files
│   │   └── results/        # Directory for processed results
│   ├── frontend/           # React frontend
│   │   ├── public/         # Static files
│   │   ├── src/            # Source code
│   │   ├── package.json    # Node.js dependencies
│   │   └── run_frontend.bat # Batch file to run the frontend
│   └── run.bat             # Batch file to run both frontend and backend
└── README.md               # This file
```

## Setup and Installation

### Prerequisites

- **For Desktop Application:**
  - Python 3.7 or higher
  - pip (Python package manager)

- **For Web Application Backend:**
  - Python 3.8 or higher
  - pip (Python package manager)

- **For Web Application Frontend:**
  - Node.js 14 or higher
  - npm (Node.js package manager)

### Desktop Application Setup

1. Install the required dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Run the application:

   ```
   python sku_mapper.py
   ```

   Or use the provided batch file (Windows):

   ```
   run_app.bat
   ```

### Web Application Setup

#### Option 1: Quick Start (Windows)

Use the provided batch file to start both the backend and frontend servers:

```
cd warehouse_web
run.bat
```

This will:
1. Create necessary directories if they don't exist
2. Start the backend server at http://localhost:5000
3. Start the frontend development server at http://localhost:3000

#### Option 2: Manual Setup

##### Backend Setup

1. Navigate to the backend directory:
   ```
   cd warehouse_web/backend
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Run the backend server:
   ```
   python run.py
   ```

   Or use the provided batch file (Windows):
   ```
   run_server.bat
   ```

##### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd warehouse_web/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

   Or use the provided batch file (Windows):
   ```
   run_frontend.bat
   ```

## Usage

### Desktop Application

1. In the "Mapping Configuration" tab:
   - Click "Load Mapping File" to select your SKU to MSKU mapping file (Excel or CSV)
   - The file should have at least two columns: "SKU" and "MSKU"

2. In the "Process Sales Data" tab:
   - Click "Load Sales File" to select your sales data file (Excel or CSV)
   - Click "Process" to map SKUs to MSKUs
   - View the results and export if needed

### Web Application

1. Open your browser and navigate to http://localhost:3000

2. Upload a mapping file:
   - Go to the "Upload" page
   - Select "Mapping File" from the dropdown
   - Choose your SKU to MSKU mapping file (Excel or CSV)
   - Click "Upload"

3. Upload a sales data file:
   - Go to the "Upload" page
   - Select "Sales Data" from the dropdown
   - Choose your sales data file (Excel or CSV)
   - Click "Upload"

4. Process the data:
   - Go to the "Process" page
   - Click "Process Data"
   - Wait for the processing to complete

5. View and export results:
   - Go to the "Results" page
   - View the processed data
   - Export the data in CSV or Excel format if needed

## API Endpoints

### Health Check
- **GET /api/health**: Check if the API is running.

### Upload Files
- **POST /api/upload/mapping**: Upload a SKU to MSKU mapping file.
- **POST /api/upload/sales**: Upload a sales data file.

### Process Data
- **POST /api/process**: Process the uploaded files.

### Results
- **GET /api/results**: Get the processing results.
- **GET /api/export**: Export the processed data to CSV or Excel format.

## File Format Requirements

### Mapping File
- Must be a CSV or Excel file.
- Must have at least two columns: 'SKU' and 'MSKU'.

### Sales Data File
- Must be a CSV or Excel file.
- Must have a 'SKU' column that will be mapped to MSKUs.

## Troubleshooting

### Desktop Application

- If the application fails to start, ensure Python and all dependencies are installed correctly.
- Check the log file (sku_mapper.log) for error messages.

### Web Application

- If the backend server fails to start:
  - Ensure Python and all dependencies are installed correctly.
  - Check if port 5000 is already in use by another application.
  - Check the log file (warehouse_api.log) for error messages.

- If the frontend server fails to start:
  - Ensure Node.js and npm are installed correctly.
  - Check if port 3000 is already in use by another application.
  - Try running `npm install` again to ensure all dependencies are installed.

- If the web application is not working correctly:
  - Ensure both backend and frontend servers are running.
  - Check the browser console for JavaScript errors.
  - Check the backend logs for API errors.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
