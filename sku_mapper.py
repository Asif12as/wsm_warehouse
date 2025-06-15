import sys
import os
import pandas as pd
import re
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
                             QPushButton, QLabel, QFileDialog, QTableWidget, QTableWidgetItem,
                             QHeaderView, QMessageBox, QComboBox, QLineEdit, QGridLayout,
                             QGroupBox, QTabWidget, QTextEdit, QProgressBar)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QFont, QIcon, QColor
from loguru import logger

# Setup logging
logger.add("sku_mapper.log", rotation="10 MB", level="INFO")

class SKUMapper:
    """Class for managing SKU to MSKU mappings"""
    
    def __init__(self):
        self.mapping_data = {}
        self.reverse_mapping = {}
        self.combo_products = {}
        self.marketplace_formats = {}
        
    def load_mapping_data(self, file_path):
        """Load mapping data from Excel or CSV file"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:  # Assume Excel format
                df = pd.read_excel(file_path)
            
            # Create a case-insensitive column mapping
            column_mapping = {col.upper(): col for col in df.columns}
            
            # Check for required columns (case-insensitive)
            required_cols = ['SKU', 'MSKU']
            required_cols_upper = [col.upper() for col in required_cols]
            
            if not all(col_upper in column_mapping for col_upper in required_cols_upper):
                missing = [col for col in required_cols if col.upper() not in column_mapping]
                logger.error(f"Missing required columns: {missing}")
                return False, f"Missing required columns: {missing}"
            
            # Get the actual column names from the file
            sku_col = column_mapping['SKU']
            msku_col = column_mapping['MSKU']
            
            # Process mapping data
            for _, row in df.iterrows():
                sku = str(row[sku_col]).strip() if not pd.isna(row[sku_col]) else ""
                msku = str(row[msku_col]).strip() if not pd.isna(row[msku_col]) else ""
                
                if not sku or not msku:
                    continue
                    
                # Handle combo products (multiple SKUs per MSKU)
                if ',' in sku:
                    skus = [s.strip() for s in sku.split(',')]
                    for s in skus:
                        self.mapping_data[s] = msku
                        if msku not in self.combo_products:
                            self.combo_products[msku] = []
                        self.combo_products[msku].append(s)
                else:
                    self.mapping_data[sku] = msku
                
                # Build reverse mapping (MSKU to SKU)
                if msku not in self.reverse_mapping:
                    self.reverse_mapping[msku] = []
                if ',' in sku:
                    self.reverse_mapping[msku].extend([s.strip() for s in sku.split(',')])
                else:
                    self.reverse_mapping[msku].append(sku)
            
            logger.info(f"Successfully loaded {len(self.mapping_data)} SKU mappings")
            return True, f"Successfully loaded {len(self.mapping_data)} SKU mappings"
            
        except Exception as e:
            logger.error(f"Error loading mapping data: {str(e)}")
            return False, f"Error loading mapping data: {str(e)}"
    
    def map_sku_to_msku(self, sku):
        """Map a SKU to its corresponding MSKU"""
        if not sku:
            return None, "Empty SKU provided"
            
        sku = str(sku).strip()
        
        # Direct mapping
        if sku in self.mapping_data:
            return self.mapping_data[sku], None
        
        # Try to match using marketplace format patterns
        for pattern, format_info in self.marketplace_formats.items():
            if re.match(pattern, sku):
                transformed_sku = self._transform_sku(sku, format_info)
                if transformed_sku in self.mapping_data:
                    return self.mapping_data[transformed_sku], None
        
        return None, f"No mapping found for SKU: {sku}"
    
    def _transform_sku(self, sku, format_info):
        """Transform SKU based on marketplace format"""
        # This is a placeholder for SKU transformation logic
        # In a real implementation, this would apply marketplace-specific transformations
        return sku
    
    def add_marketplace_format(self, name, pattern, transform_function):
        """Add a marketplace format for SKU identification"""
        self.marketplace_formats[pattern] = {
            'name': name,
            'transform': transform_function
        }
        logger.info(f"Added marketplace format: {name}")
    
    def validate_sku_format(self, sku):
        """Validate if a SKU follows expected format"""
        if not sku or not isinstance(sku, str):
            return False, "SKU must be a non-empty string"
            
        # Basic validation - can be extended with specific rules
        if len(sku.strip()) < 2:
            return False, "SKU is too short"
            
        return True, None
    
    def get_all_mappings(self):
        """Return all SKU to MSKU mappings"""
        return self.mapping_data
    
    def get_combo_products(self):
        """Return all combo products (MSKUs with multiple SKUs)"""
        return self.combo_products


class DataProcessingThread(QThread):
    """Thread for processing data in the background"""
    progress_update = pyqtSignal(int, str)
    processing_complete = pyqtSignal(bool, str, pd.DataFrame)
    
    def __init__(self, mapper, file_path, file_type):
        super().__init__()
        self.mapper = mapper
        self.file_path = file_path
        self.file_type = file_type
        
    def run(self):
        try:
            # Load the sales data
            if self.file_path.endswith('.csv'):
                df = pd.read_csv(self.file_path)
            else:  # Assume Excel format
                df = pd.read_excel(self.file_path)
                
            self.progress_update.emit(10, "File loaded successfully")
            
            # Identify the SKU column based on file type or column names
            sku_column = self._identify_sku_column(df)
            if not sku_column:
                self.processing_complete.emit(False, "Could not identify SKU column", None)
                return
                
            self.progress_update.emit(30, f"Identified SKU column: {sku_column}")
            
            # Add MSKU column
            df['MSKU'] = None
            total_rows = len(df)
            mapped_count = 0
            unmapped_count = 0
            
            for idx, row in df.iterrows():
                if idx % 100 == 0:
                    progress = int(30 + (idx / total_rows * 60))
                    self.progress_update.emit(progress, f"Processing row {idx} of {total_rows}")
                    
                sku = str(row[sku_column]).strip() if not pd.isna(row[sku_column]) else ""
                if sku:
                    msku, error = self.mapper.map_sku_to_msku(sku)
                    if msku:
                        df.at[idx, 'MSKU'] = msku
                        mapped_count += 1
                    else:
                        unmapped_count += 1
            
            self.progress_update.emit(95, "Finalizing results")
            
            # Generate summary
            summary = f"Processed {total_rows} rows. Mapped: {mapped_count}, Unmapped: {unmapped_count}"
            self.processing_complete.emit(True, summary, df)
            
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}")
            self.processing_complete.emit(False, f"Error processing file: {str(e)}", None)
    
    def _identify_sku_column(self, df):
        """Identify the column containing SKUs"""
        # Create a case-insensitive column mapping
        column_mapping = {col.upper(): col for col in df.columns}
        
        # Common column names for SKUs (case-insensitive)
        possible_sku_columns = ['SKU', 'sku', 'Product SKU', 'product_sku', 'Item SKU', 'item_sku',
                              'SKU Number', 'sku_number', 'Product ID', 'product_id']
        
        # Check if any of the common names exist (case-insensitive)
        for col in possible_sku_columns:
            if col.upper() in column_mapping:
                return column_mapping[col.upper()]
        
        # If no standard column is found, try to identify based on content
        # This is a simplified approach and might need refinement
        for col in df.columns:
            # Check first few non-null values to see if they match SKU patterns
            sample = df[col].dropna().head(5).astype(str)
            if all(len(s) >= 3 for s in sample):
                return col
        
        return None


class SKUMapperApp(QMainWindow):
    """Main application window for SKU Mapper"""
    
    def __init__(self):
        super().__init__()
        self.mapper = SKUMapper()
        self.processed_data = None
        self.initUI()
        
    def initUI(self):
        """Initialize the user interface"""
        self.setWindowTitle("SKU to MSKU Mapper")
        self.setGeometry(100, 100, 1000, 700)
        
        # Create main widget and layout
        main_widget = QWidget()
        main_layout = QVBoxLayout(main_widget)
        
        # Create tabs
        tabs = QTabWidget()
        mapping_tab = QWidget()
        processing_tab = QWidget()
        results_tab = QWidget()
        
        tabs.addTab(mapping_tab, "Mapping Configuration")
        tabs.addTab(processing_tab, "Process Sales Data")
        tabs.addTab(results_tab, "Results")
        
        # Setup each tab
        self._setup_mapping_tab(mapping_tab)
        self._setup_processing_tab(processing_tab)
        self._setup_results_tab(results_tab)
        
        main_layout.addWidget(tabs)
        self.setCentralWidget(main_widget)
        
        # Status bar for messages
        self.statusBar().showMessage("Ready")
        
    def _setup_mapping_tab(self, tab):
        """Setup the mapping configuration tab"""
        layout = QVBoxLayout(tab)
        
        # Mapping file section
        mapping_group = QGroupBox("SKU to MSKU Mapping File")
        mapping_layout = QGridLayout(mapping_group)
        
        self.mapping_path_label = QLabel("No file selected")
        self.mapping_path_label.setWordWrap(True)
        
        load_mapping_btn = QPushButton("Load Mapping File")
        load_mapping_btn.clicked.connect(self.load_mapping_file)
        
        mapping_layout.addWidget(QLabel("Mapping File:"), 0, 0)
        mapping_layout.addWidget(self.mapping_path_label, 0, 1)
        mapping_layout.addWidget(load_mapping_btn, 0, 2)
        
        # Mapping statistics
        self.mapping_stats_label = QLabel("No mapping data loaded")
        mapping_layout.addWidget(QLabel("Statistics:"), 1, 0)
        mapping_layout.addWidget(self.mapping_stats_label, 1, 1, 1, 2)
        
        layout.addWidget(mapping_group)
        
        # Marketplace formats section
        marketplace_group = QGroupBox("Marketplace Formats")
        marketplace_layout = QVBoxLayout(marketplace_group)
        
        # This would be expanded in a real application to allow adding custom marketplace formats
        marketplace_layout.addWidget(QLabel("Standard marketplace formats are pre-configured."))
        
        layout.addWidget(marketplace_group)
        
        # View mappings section
        view_group = QGroupBox("View Mappings")
        view_layout = QVBoxLayout(view_group)
        
        self.mappings_table = QTableWidget(0, 2)
        self.mappings_table.setHorizontalHeaderLabels(["SKU", "MSKU"])
        self.mappings_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        
        view_layout.addWidget(self.mappings_table)
        layout.addWidget(view_group)
        
    def _setup_processing_tab(self, tab):
        """Setup the sales data processing tab"""
        layout = QVBoxLayout(tab)
        
        # File selection section
        file_group = QGroupBox("Sales Data File")
        file_layout = QGridLayout(file_group)
        
        self.sales_path_label = QLabel("No file selected")
        self.sales_path_label.setWordWrap(True)
        
        load_sales_btn = QPushButton("Load Sales Data")
        load_sales_btn.clicked.connect(self.load_sales_file)
        
        file_layout.addWidget(QLabel("Sales File:"), 0, 0)
        file_layout.addWidget(self.sales_path_label, 0, 1)
        file_layout.addWidget(load_sales_btn, 0, 2)
        
        # File type selection
        file_layout.addWidget(QLabel("File Type:"), 1, 0)
        self.file_type_combo = QComboBox()
        self.file_type_combo.addItems(["Auto Detect", "Amazon", "eBay", "Walmart", "Shopify", "Other"])
        file_layout.addWidget(self.file_type_combo, 1, 1)
        
        layout.addWidget(file_group)
        
        # Processing section
        process_group = QGroupBox("Process Data")
        process_layout = QVBoxLayout(process_group)
        
        self.process_btn = QPushButton("Process Sales Data")
        self.process_btn.clicked.connect(self.process_sales_data)
        self.process_btn.setEnabled(False)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setValue(0)
        
        self.progress_label = QLabel("Ready to process")
        
        process_layout.addWidget(self.process_btn)
        process_layout.addWidget(self.progress_bar)
        process_layout.addWidget(self.progress_label)
        
        layout.addWidget(process_group)
        
        # Preview section
        preview_group = QGroupBox("Data Preview")
        preview_layout = QVBoxLayout(preview_group)
        
        self.preview_table = QTableWidget(0, 0)
        preview_layout.addWidget(self.preview_table)
        
        layout.addWidget(preview_group)
        
    def _setup_results_tab(self, tab):
        """Setup the results tab"""
        layout = QVBoxLayout(tab)
        
        # Results table
        self.results_table = QTableWidget(0, 0)
        layout.addWidget(self.results_table)
        
        # Export section
        export_layout = QHBoxLayout()
        
        self.export_btn = QPushButton("Export Results")
        self.export_btn.clicked.connect(self.export_results)
        self.export_btn.setEnabled(False)
        
        export_layout.addWidget(self.export_btn)
        layout.addLayout(export_layout)
        
    def load_mapping_file(self):
        """Load SKU to MSKU mapping file"""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Mapping File", "", "Excel Files (*.xlsx *.xls);;CSV Files (*.csv);;All Files (*)"
        )
        
        if not file_path:
            return
            
        self.mapping_path_label.setText(file_path)
        success, message = self.mapper.load_mapping_data(file_path)
        
        if success:
            self.statusBar().showMessage(message, 5000)
            self.mapping_stats_label.setText(
                f"Loaded {len(self.mapper.get_all_mappings())} SKU mappings. "
                f"Combo products: {len(self.mapper.get_combo_products())}"
            )
            self._update_mappings_table()
        else:
            QMessageBox.warning(self, "Error", message)
            self.mapping_stats_label.setText("Failed to load mapping data")
    
    def _update_mappings_table(self):
        """Update the mappings table with current data"""
        mappings = self.mapper.get_all_mappings()
        self.mappings_table.setRowCount(len(mappings))
        
        for row, (sku, msku) in enumerate(mappings.items()):
            self.mappings_table.setItem(row, 0, QTableWidgetItem(sku))
            self.mappings_table.setItem(row, 1, QTableWidgetItem(msku))
    
    def load_sales_file(self):
        """Load sales data file"""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Sales Data File", "", "Excel Files (*.xlsx *.xls);;CSV Files (*.csv);;All Files (*)"
        )
        
        if not file_path:
            return
            
        self.sales_path_label.setText(file_path)
        
        try:
            # Load preview
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, nrows=10)
            else:  # Assume Excel format
                df = pd.read_excel(file_path, nrows=10)
                
            self._update_preview_table(df)
            self.process_btn.setEnabled(True)
            self.statusBar().showMessage("Sales data file loaded for preview", 5000)
            
        except Exception as e:
            QMessageBox.warning(self, "Error", f"Error loading sales data: {str(e)}")
    
    def _update_preview_table(self, df):
        """Update the preview table with data"""
        self.preview_table.setRowCount(len(df))
        self.preview_table.setColumnCount(len(df.columns))
        self.preview_table.setHorizontalHeaderLabels(df.columns)
        
        for row in range(len(df)):
            for col in range(len(df.columns)):
                value = str(df.iloc[row, col])
                self.preview_table.setItem(row, col, QTableWidgetItem(value))
                
        self.preview_table.resizeColumnsToContents()
    
    def process_sales_data(self):
        """Process the sales data file"""
        if not self.sales_path_label.text() or self.sales_path_label.text() == "No file selected":
            QMessageBox.warning(self, "Error", "Please select a sales data file first")
            return
            
        if not self.mapper.get_all_mappings():
            QMessageBox.warning(self, "Error", "Please load mapping data first")
            return
        
        # Start processing in a separate thread
        self.progress_bar.setValue(0)
        self.progress_label.setText("Starting processing...")
        
        file_type = self.file_type_combo.currentText()
        self.processing_thread = DataProcessingThread(
            self.mapper, self.sales_path_label.text(), file_type
        )
        
        self.processing_thread.progress_update.connect(self.update_progress)
        self.processing_thread.processing_complete.connect(self.processing_finished)
        
        self.process_btn.setEnabled(False)
        self.processing_thread.start()
    
    def update_progress(self, value, message):
        """Update progress bar and message"""
        self.progress_bar.setValue(value)
        self.progress_label.setText(message)
    
    def processing_finished(self, success, message, data):
        """Handle completion of data processing"""
        self.process_btn.setEnabled(True)
        
        if success:
            self.processed_data = data
            self._update_results_table(data)
            self.export_btn.setEnabled(True)
            self.statusBar().showMessage(message, 5000)
        else:
            QMessageBox.warning(self, "Error", message)
    
    def _update_results_table(self, df):
        """Update the results table with processed data"""
        self.results_table.setRowCount(len(df))
        self.results_table.setColumnCount(len(df.columns))
        self.results_table.setHorizontalHeaderLabels(df.columns)
        
        for row in range(len(df)):
            for col in range(len(df.columns)):
                value = str(df.iloc[row, col])
                item = QTableWidgetItem(value)
                
                # Highlight unmapped SKUs
                if df.columns[col] == 'MSKU' and (pd.isna(df.iloc[row, col]) or not df.iloc[row, col]):
                    item.setBackground(QColor(255, 200, 200))  # Light red
                    
                self.results_table.setItem(row, col, item)
                
        self.results_table.resizeColumnsToContents()
    
    def export_results(self):
        """Export processed data to file"""
        if self.processed_data is None:
            QMessageBox.warning(self, "Error", "No processed data to export")
            return
            
        file_path, _ = QFileDialog.getSaveFileName(
            self, "Export Results", "", "Excel Files (*.xlsx);;CSV Files (*.csv)"
        )
        
        if not file_path:
            return
            
        try:
            if file_path.endswith('.csv'):
                self.processed_data.to_csv(file_path, index=False)
            else:
                if not file_path.endswith('.xlsx'):
                    file_path += '.xlsx'
                self.processed_data.to_excel(file_path, index=False)
                
            self.statusBar().showMessage(f"Results exported to {file_path}", 5000)
            
        except Exception as e:
            QMessageBox.warning(self, "Error", f"Error exporting results: {str(e)}")


def main():
    app = QApplication(sys.argv)
    window = SKUMapperApp()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()