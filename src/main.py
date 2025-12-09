"""
DocPrep - Main Entry Point
Modern document extraction tool with web-based UI
"""

import sys
import logging
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import LOG_LEVEL, LOG_FORMAT, APP_NAME, APP_VERSION


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
    logger.info("=" * 60)
    logger.info(f"{APP_NAME} v{APP_VERSION}")
    logger.info("=" * 60)
    
    try:
        # Import and run the webview-based GUI
        from gui.webview_app import WebviewApp
        
        app = WebviewApp()
        app.run()
    except Exception as e:
        logger.error(f"Application error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

