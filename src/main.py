"""
Data Extraction Tool - Main Entry Point
"""

import sys
import logging
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent))

from gui.main_window import MainWindow
from config import LOG_LEVEL, LOG_FORMAT


def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL),
        format=LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )


def main():
    """Main application entry point"""
    # Setup logging
    setup_logging()
    
    logger = logging.getLogger(__name__)
    logger.info("="*80)
    logger.info("Data Extraction Tool")
    logger.info("="*80)
    
    try:
        # Create and run main window
        app = MainWindow()
        app.run()
    except Exception as e:
        logger.error(f"Application error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

