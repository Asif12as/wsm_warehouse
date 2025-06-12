import logging
import sys
from datetime import datetime
from typing import Optional

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Set up a logger with consistent formatting"""
    
    logger = logging.getLogger(name)
    
    # Avoid adding multiple handlers
    if logger.handlers:
        return logger
    
    logger.setLevel(getattr(logging, level.upper()))
    
    # Create formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    try:
        file_handler = logging.FileHandler('logs/wms.log')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except:
        # If logs directory doesn't exist, skip file logging
        pass
    
    return logger

class DatabaseLogger:
    """Logger that writes to database for audit trails"""
    
    def __init__(self, db_session):
        self.db = db_session
        self.logger = setup_logger(self.__class__.__name__)
    
    def log_event(self, level: str, message: str, module: Optional[str] = None, 
                  function: Optional[str] = None, user_id: Optional[str] = None, 
                  metadata: Optional[dict] = None):
        """Log event to database"""
        try:
            from database.models import SystemLog
            
            log_entry = SystemLog(
                level=level.upper(),
                message=message,
                module=module,
                function=function,
                user_id=user_id,
                metadata=metadata
            )
            
            self.db.add(log_entry)
            self.db.commit()
            
        except Exception as e:
            self.logger.error(f"Failed to log to database: {str(e)}")
    
    def info(self, message: str, **kwargs):
        self.log_event("INFO", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self.log_event("WARNING", message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self.log_event("ERROR", message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self.log_event("DEBUG", message, **kwargs)