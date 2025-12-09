"""
PyWebview-based GUI for DocPrep
Provides a modern web-based interface with Python backend
"""

import webview
import threading
import logging
import subprocess
import platform
from pathlib import Path
from typing import Optional, Dict

from config import (
    APP_NAME, APP_VERSION, WINDOW_WIDTH, WINDOW_HEIGHT,
    DEFAULT_OUTPUT_SUFFIX
)
from utils.file_scanner import FileScanner, ExtractionManager
from utils.report import ReportGenerator
from extractors.excel import ExcelExtractor
from extractors.pdf import PDFExtractor
from extractors.word import WordExtractor
from extractors.powerpoint import PowerPointExtractor

logger = logging.getLogger(__name__)


class DocPrepAPI:
    """
    JavaScript API exposed to the webview frontend.
    All methods here can be called from JavaScript via pywebview.api
    """
    
    def __init__(self):
        self.window: Optional[webview.Window] = None
        self.input_folder: Optional[Path] = None
        self.output_folder: Optional[Path] = None
        self.extraction_manager: Optional[ExtractionManager] = None
        self.extraction_thread: Optional[threading.Thread] = None
        self.scanner: Optional[FileScanner] = None
    
    def set_window(self, window: webview.Window):
        """Set the webview window reference"""
        self.window = window
    
    def select_folder(self) -> Optional[Dict]:
        """
        Open native folder selection dialog.
        Returns folder info or None if cancelled.
        """
        result = self.window.create_file_dialog(
            webview.FOLDER_DIALOG,
            directory='',
            allow_multiple=False
        )
        
        if result and len(result) > 0:
            folder_path = result[0]
            return self._get_folder_info(folder_path)
        
        return None
    
    def validate_folder(self, path: str) -> Optional[Dict]:
        """
        Validate a folder path (from drag-and-drop).
        Returns folder info or None if invalid.
        """
        folder_path = Path(path)
        
        if folder_path.is_dir():
            return self._get_folder_info(str(folder_path))
        
        return None
    
    def _get_folder_info(self, folder_path: str) -> Dict:
        """
        Get folder information including supported file count.
        """
        path = Path(folder_path)
        self.input_folder = path
        
        # Quick scan for file count
        self.scanner = FileScanner(path)
        scan_results = self.scanner.scan()
        
        # Set default output folder
        self.output_folder = Path(str(path) + DEFAULT_OUTPUT_SUFFIX)
        
        return {
            'path': str(path),
            'name': path.name,
            'file_count': scan_results['supported_count']
        }
    
    def start_extraction(self) -> None:
        """
        Start the extraction process in a background thread.
        Progress updates are pushed to JavaScript via evaluate_js.
        """
        if not self.input_folder or not self.scanner:
            self._call_js('showError', 'No folder selected')
            return
        
        # Start extraction in background thread
        self.extraction_thread = threading.Thread(
            target=self._run_extraction,
            daemon=True
        )
        self.extraction_thread.start()
    
    def _run_extraction(self):
        """Run the extraction process (called in background thread)"""
        try:
            # Create output directory
            self.output_folder.mkdir(parents=True, exist_ok=True)
            
            # Create extractors
            extractors = [
                ExcelExtractor(self.output_folder),
                PDFExtractor(self.output_folder),
                WordExtractor(self.output_folder),
                PowerPointExtractor(self.output_folder)
            ]
            
            # Create extraction manager
            self.extraction_manager = ExtractionManager(self.scanner, extractors)
            
            # Extract files with callbacks
            extraction_summary = self.extraction_manager.extract_all(
                self.output_folder,
                progress_callback=self._on_progress,
                file_callback=self._on_file_start
            )
            
            # Check if cancelled
            if extraction_summary.get('cancelled'):
                self._call_js('showCancelled')
                return
            
            # Generate report
            scan_results = {
                'supported_count': len(self.scanner.supported_files),
                'unsupported_count': len(self.scanner.unsupported_files),
                'total_size': self.scanner.total_size,
                'supported_files': self.scanner.supported_files,
                'file_types': self.scanner._count_file_types()
            }
            
            ReportGenerator.generate_summary_report(
                self.output_folder,
                scan_results,
                extraction_summary,
                self.extraction_manager.results
            )
            
            # Show completion
            results = {
                'processed': extraction_summary['total_processed'],
                'extracted': extraction_summary['total_files_extracted'],
                'warnings': extraction_summary['warnings'],
                'errors': extraction_summary['failed']
            }
            
            self._call_js('showComplete', results)
            
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            self._call_js('showError', str(e))
    
    def _on_progress(self, current: int, total: int):
        """Progress callback - push to JavaScript"""
        self._call_js('updateProgress', current, total)
    
    def _on_file_start(self, filepath: Path, current: int, total: int):
        """File start callback - push to JavaScript"""
        self._call_js('updateCurrentFile', filepath.name)
    
    def _call_js(self, function_name: str, *args):
        """Call a JavaScript function from Python"""
        if not self.window:
            return
        
        # Format arguments for JavaScript
        js_args = ', '.join(
            f'"{arg}"' if isinstance(arg, str) else 
            str(arg).lower() if isinstance(arg, bool) else
            str(arg) if isinstance(arg, (int, float)) else
            self._dict_to_js(arg) if isinstance(arg, dict) else
            str(arg)
            for arg in args
        )
        
        js_code = f'{function_name}({js_args})'
        
        try:
            self.window.evaluate_js(js_code)
        except Exception as e:
            logger.warning(f"Failed to call JS: {e}")
    
    def _dict_to_js(self, d: dict) -> str:
        """Convert Python dict to JavaScript object literal"""
        import json
        return json.dumps(d)
    
    def cancel_extraction(self) -> None:
        """Cancel the current extraction process"""
        if self.extraction_manager:
            self.extraction_manager.cancel()
            logger.info("Extraction cancellation requested")
    
    def open_output_folder(self) -> None:
        """Open the output folder in the system file explorer"""
        if not self.output_folder or not self.output_folder.exists():
            return
        
        try:
            if platform.system() == 'Darwin':  # macOS
                subprocess.run(['open', str(self.output_folder)])
            elif platform.system() == 'Windows':
                subprocess.run(['explorer', str(self.output_folder)])
            else:  # Linux
                subprocess.run(['xdg-open', str(self.output_folder)])
        except Exception as e:
            logger.warning(f"Failed to open folder: {e}")
    
    # Window control methods for custom title bar
    def minimize_window(self) -> None:
        """Minimize the window"""
        if self.window:
            self.window.minimize()
    
    def toggle_fullscreen(self) -> None:
        """Toggle fullscreen mode"""
        if self.window:
            self.window.toggle_fullscreen()
    
    def close_window(self) -> None:
        """Close the window"""
        if self.window:
            self.window.destroy()


class WebviewApp:
    """Main application class for the PyWebview-based GUI"""
    
    def __init__(self):
        self.api = DocPrepAPI()
        self.window: Optional[webview.Window] = None
    
    def run(self):
        """Start the application"""
        logger.info(f"Starting {APP_NAME} v{APP_VERSION}")
        
        # Get the path to the web assets
        current_dir = Path(__file__).parent
        web_dir = current_dir / 'web'
        html_path = web_dir / 'index.html'
        
        # Create the webview window (frameless for custom title bar)
        self.window = webview.create_window(
            title=f'{APP_NAME} v{APP_VERSION}',
            url=str(html_path),
            width=WINDOW_WIDTH,
            height=WINDOW_HEIGHT,
            min_size=(600, 500),
            js_api=self.api,
            background_color='#ffffff',
            frameless=True,
            easy_drag=False
        )
        
        # Set window reference in API
        self.api.set_window(self.window)
        
        # Start the webview
        webview.start(debug=False)


def main():
    """Entry point for the webview GUI"""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    app = WebviewApp()
    app.run()


if __name__ == '__main__':
    main()

