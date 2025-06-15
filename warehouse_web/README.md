# Warehouse Management System - Web Application

This web application is Part 3 of the Warehouse Management System project, providing a user-friendly interface for uploading, processing, and visualizing sales data with SKU to MSKU mapping.

## Project Structure

```
warehouse_web/
├── backend/               # Flask backend
│   ├── app.py             # Main Flask application
│   ├── config.py          # Configuration settings
│   ├── requirements.txt   # Python dependencies
│   ├── run.py             # Entry point for running the server
│   ├── run_server.bat     # Batch file to run the server on Windows
│   ├── sku_mapper_utils.py # Utility functions for SKU mapping
│   ├── uploads/           # Directory for uploaded files
│   └── results/           # Directory for processed results
├── frontend/             # React frontend
│   ├── public/           # Static files
│   ├── src/              # Source code
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── App.js        # Main application component
│   │   └── index.js      # Entry point
│   ├── package.json      # Node.js dependencies
│   └── run_frontend.bat  # Batch file to run the frontend on Windows
└── README.md             # This file
```

## Features

- Upload SKU mapping files
- Upload sales data files
- Process data to map SKUs to MSKUs
- Visualize processed data
- Export processed data

## Backend Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

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

### Running the Backend

1. On Windows, you can use the provided batch file:
   ```
   run_server.bat
   ```

2. Alternatively, you can run the server manually:
   ```
   python run.py
   ```

The backend server will start at http://localhost:5000.

## Frontend Setup

### Prerequisites

- Node.js 14 or higher
- npm (Node.js package manager)

### Installation

1. Navigate to the frontend directory:
   ```
   cd warehouse_web/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Running the Frontend

1. On Windows, you can use the provided batch file:
   ```
   run_frontend.bat
   ```

2. Alternatively, you can start the development server manually:
   ```
   npm start
   ```

The frontend development server will start at http://localhost:3000.

## API Endpoints

### Health Check
- **GET /api/health**: Check if the API is running.

### Upload Files
- **POST /api/upload/mapping**: Upload a SKU to MSKU mapping file.
  - Request: `multipart/form-data` with `file` field containing the mapping file.
  - Response: JSON with session ID and filename.

- **POST /api/upload/sales**: Upload a sales data file.
  - Request: `multipart/form-data` with `file` field containing the sales data file.
  - Response: JSON with session ID and filename.

### Process Data
- **POST /api/process**: Process the uploaded files.
  - Request: JSON with `session_id` field.
  - Response: JSON with processing status and message.

### Results
- **GET /api/results**: Get the processing results.
  - Query Parameters: `session_id`
  - Response: JSON with processed data and summary statistics.

- **GET /api/export**: Export the processed data to CSV or Excel format.
  - Query Parameters: `session_id`, `format` (csv or xlsx)
  - Response: File download of the processed data.

## File Format Requirements

### Mapping File
- Must be a CSV or Excel file.
- Must have at least two columns: 'SKU' and 'MSKU'.

### Sales Data File
- Must be a CSV or Excel file.
- Must have a 'SKU' column that will be mapped to MSKUs.