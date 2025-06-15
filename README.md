# SKU to MSKU Mapper

A Python application with a graphical user interface (GUI) that allows users to easily map Stock Keeping Units (SKUs) to Master SKUs (MSKUs).

## Overview

This application helps warehouse management by providing a simple interface to:

1. Load SKU to MSKU mapping data
2. Process sales data files from various marketplaces
3. Automatically map SKUs to their corresponding MSKUs
4. Export the processed data for further use

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

## Installation

1. Ensure you have Python 3.7+ installed
2. Install the required dependencies:

```
pip install -r requirements.txt
```

## Usage

1. Run the application:

```
python sku_mapper.py
```

2. In the "Mapping Configuration" tab:
   - Click "Load Mapping File" to select your SKU to MSKU mapping file (Excel or CSV)
   - The file should have at least two columns: "SKU" and "MSKU"
   - View the loaded mappings in the table

3. In the "Process Sales Data" tab:
   - Click "Load Sales Data" to select your sales data file (Excel or CSV)
   - Select the appropriate file type from the dropdown
   - Click "Process Sales Data" to map SKUs to MSKUs

4. In the "Results" tab:
   - View the processed data with mapped MSKUs
   - Click "Export Results" to save the processed data to a file

## File Format Requirements

### Mapping File

The mapping file should be an Excel (.xlsx, .xls) or CSV file with at least these columns:
- **SKU**: The stock keeping unit identifier
- **MSKU**: The master stock keeping unit identifier

For combo products, you can include multiple SKUs in the SKU column separated by commas.

### Sales Data File

The sales data file can be in Excel or CSV format. The application will attempt to automatically identify the SKU column based on common column names or patterns.

## Logging

The application logs its operations to `sku_mapper.log` for troubleshooting and auditing purposes.