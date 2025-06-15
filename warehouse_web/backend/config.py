import os
from pathlib import Path

# Base directory of the backend
BASE_DIR = Path(__file__).resolve().parent

# Directory for storing uploaded files
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

# Directory for storing processed results
RESULTS_FOLDER = os.path.join(BASE_DIR, 'results')

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

# Maximum file size (10 MB)
MAX_CONTENT_LENGTH = 10 * 1024 * 1024

# Flask configuration
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-warehouse-app'
    UPLOAD_FOLDER = UPLOAD_FOLDER
    RESULTS_FOLDER = RESULTS_FOLDER
    MAX_CONTENT_LENGTH = MAX_CONTENT_LENGTH
    DEBUG = True
    TESTING = False

# Create necessary directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)