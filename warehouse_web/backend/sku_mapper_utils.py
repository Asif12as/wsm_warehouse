import pandas as pd
import os
import uuid
from loguru import logger

class SKUMapper:
    """Utility class for mapping SKUs to MSKUs"""
    
    def __init__(self):
        self.mapping_data = None
        self.sales_data = None
        self.processed_data = None
        self.unmapped_skus = set()
    
    def load_mapping_file(self, file_path):
        """Load SKU to MSKU mapping from file"""
        try:
            # Determine file type and read accordingly
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
            
            # Validate required columns
            required_columns = ['SKU', 'MSKU']
            if not all(col in df.columns for col in required_columns):
                missing = [col for col in required_columns if col not in df.columns]
                raise ValueError(f"Missing required columns: {', '.join(missing)}")
            
            # Store mapping data
            self.mapping_data = df
            
            logger.info(f"Successfully loaded mapping file with {len(df)} entries")
            return True, f"Successfully loaded mapping file with {len(df)} entries"
            
        except Exception as e:
            logger.error(f"Error loading mapping file: {str(e)}")
            return False, f"Error loading mapping file: {str(e)}"
    
    def load_sales_file(self, file_path):
        """Load sales data from file"""
        try:
            # Determine file type and read accordingly
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")
            
            # Validate required columns
            if 'SKU' not in df.columns:
                raise ValueError("Sales data must contain 'SKU' column")
            
            # Store sales data
            self.sales_data = df
            
            logger.info(f"Successfully loaded sales file with {len(df)} entries")
            return True, f"Successfully loaded sales file with {len(df)} entries"
            
        except Exception as e:
            logger.error(f"Error loading sales file: {str(e)}")
            return False, f"Error loading sales file: {str(e)}"
    
    def process_data(self):
        """Process sales data using the mapping data"""
        if self.mapping_data is None:
            return False, "Mapping data not loaded"
        
        if self.sales_data is None:
            return False, "Sales data not loaded"
        
        try:
            # Create a mapping dictionary for faster lookups
            sku_to_msku = dict(zip(self.mapping_data['SKU'], self.mapping_data['MSKU']))
            
            # Create a copy of the sales data
            processed_df = self.sales_data.copy()
            
            # Add MSKU column
            processed_df['MSKU'] = processed_df['SKU'].map(sku_to_msku)
            
            # Track unmapped SKUs
            self.unmapped_skus = set(processed_df[processed_df['MSKU'].isna()]['SKU'].unique())
            
            # Store processed data
            self.processed_data = processed_df
            
            unmapped_count = len(self.unmapped_skus)
            mapped_count = len(processed_df) - processed_df['MSKU'].isna().sum()
            
            logger.info(f"Processing complete. {mapped_count} entries mapped, {unmapped_count} unique SKUs unmapped")
            
            return True, {
                "total_rows": len(processed_df),
                "mapped_count": mapped_count,
                "unmapped_count": unmapped_count,
                "unmapped_skus": list(self.unmapped_skus)
            }
            
        except Exception as e:
            logger.error(f"Error processing data: {str(e)}")
            return False, f"Error processing data: {str(e)}"
    
    def get_processed_data(self):
        """Get the processed data"""
        if self.processed_data is None:
            return None
        
        return self.processed_data
    
    def export_data(self, output_path, format_type='csv'):
        """Export processed data to file"""
        if self.processed_data is None:
            return False, "No processed data to export"
        
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Export based on format
            if format_type.lower() == 'xlsx':
                self.processed_data.to_excel(output_path, index=False)
            else:  # Default to CSV
                self.processed_data.to_csv(output_path, index=False)
            
            logger.info(f"Successfully exported data to {output_path}")
            return True, output_path
            
        except Exception as e:
            logger.error(f"Error exporting data: {str(e)}")
            return False, f"Error exporting data: {str(e)}"

# Helper functions for the API
def process_files(mapping_file_path, sales_file_path, output_dir):
    """Process mapping and sales files and return results"""
    mapper = SKUMapper()
    
    # Load mapping file
    mapping_success, mapping_message = mapper.load_mapping_file(mapping_file_path)
    if not mapping_success:
        return False, mapping_message, None
    
    # Load sales file
    sales_success, sales_message = mapper.load_sales_file(sales_file_path)
    if not sales_success:
        return False, sales_message, None
    
    # Process data
    process_success, process_result = mapper.process_data()
    if not process_success:
        return False, process_result, None
    
    # Export data
    result_filename = f"{uuid.uuid4().hex}_result.csv"
    result_path = os.path.join(output_dir, result_filename)
    
    export_success, export_message = mapper.export_data(result_path)
    if not export_success:
        return False, export_message, None
    
    # Return processed data
    processed_data = mapper.get_processed_data()
    
    return True, process_result, {
        "file_path": result_path,
        "data": processed_data
    }