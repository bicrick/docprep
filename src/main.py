"""
DocPrep - Main Entry Point
Modern document extraction tool with web-based UI
"""

import sys
import logging
import argparse
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


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description=f'{APP_NAME} - Document extraction tool')
    parser.add_argument(
        '--dev',
        action='store_true',
        help='Run in development mode (connects to Vite dev server at localhost:5173)'
    )
    return parser.parse_args()


def main():
    """Main application entry point"""
    # Parse arguments
    args = parse_args()
    
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
        
        # Enable dev mode if --dev flag is passed
        if args.dev:
            app.DEV_MODE = True
            logger.info("Development mode enabled - make sure 'npm run dev' is running in src/gui/web/")
        
        app.run()
    except Exception as e:
        logger.error(f"Application error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

