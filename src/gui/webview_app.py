"""
PyWebview-based GUI for DocPrep
Provides a modern web-based interface with Python backend
"""

import webview
import threading
import logging
import subprocess
import platform
import sys
from pathlib import Path
from typing import Optional, Dict
from io import StringIO

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

# Suppress pywebview's internal error logging on Windows
# These errors are from internal introspection and don't affect functionality
if platform.system() == 'Windows':
    pywebview_logger = logging.getLogger('pywebview')
    pywebview_logger.setLevel(logging.CRITICAL)
    
    # Add a filter to suppress specific error patterns in logging
    class PywebviewErrorFilter(logging.Filter):
        def filter(self, record):
            msg = str(record.getMessage()).lower()
            # Filter out known pywebview introspection errors
            if any(keyword in msg for keyword in [
                'maximum recursion depth',
                'corewebview2',
                'com object',
                'no such interface',
                'ui thread',
                'accessibilityobject',
                'error while processing window.native'
            ]):
                return False
            return True
    
    # Apply filter to root logger to catch all pywebview errors
    logging.getLogger().addFilter(PywebviewErrorFilter())
    
    # Create a filtered stderr wrapper to catch direct prints from pywebview
    class FilteredStderr:
        """Filter stderr to suppress pywebview introspection errors"""
        def __init__(self, original_stderr):
            self.original_stderr = original_stderr
            self.buffer = StringIO()
            # Track partial lines in case errors span multiple writes
            self.partial_line = ''
        
        def write(self, text):
            # Combine with any partial line from previous write
            full_text = self.partial_line + text
            self.partial_line = ''
            
            # Check if this is a complete line (ends with newline)
            if '\n' in full_text:
                lines = full_text.split('\n')
                # Last part might be incomplete
                self.partial_line = lines[-1]
                lines_to_check = lines[:-1]
            else:
                # Incomplete line, save for next write
                self.partial_line = full_text
                return
            
            # Filter out pywebview introspection errors
            for line in lines_to_check:
                line_lower = line.lower()
                # Check for various pywebview error patterns
                if any(keyword in line_lower for keyword in [
                    '[pywebview]',
                    'error while processing window.native',
                    'maximum recursion depth',
                    'corewebview2',
                    'com object',
                    'no such interface',
                    'ui thread',
                    'accessibilityobject',
                    'bounds.empty',
                    'empty.empty.empty',  # Catches the repeated .Empty pattern
                    'invalidcastexception',
                    'queryinterface',
                    'e_nointerface'
                ]):
                    # Suppress these errors - they're harmless pywebview introspection issues
                    continue
                # Write non-filtered lines to original stderr
                self.original_stderr.write(line + '\n')
        
        def flush(self):
            # Flush any remaining partial line
            if self.partial_line:
                line_lower = self.partial_line.lower()
                if not any(keyword in line_lower for keyword in [
                    '[pywebview]',
                    'error while processing window.native',
                    'maximum recursion depth',
                    'corewebview2',
                    'accessibilityobject',
                    'bounds.empty',
                    'empty.empty.empty'
                ]):
                    self.original_stderr.write(self.partial_line)
                self.partial_line = ''
            self.original_stderr.flush()
        
        def __getattr__(self, name):
            # Delegate all other attributes to original stderr
            return getattr(self.original_stderr, name)
    
    # Replace stderr with filtered version
    sys.stderr = FilteredStderr(sys.stderr)


def detect_system_theme() -> str:
    """
    Detect the system's color scheme (dark or light mode).
    Returns 'dark' or 'light'.
    
    Uses platform-specific APIs:
    - macOS: AppKit NSAppearance
    - Windows: Registry (AppsUseLightTheme)
    - Linux: GTK settings or environment variables
    """
    system = platform.system()
    
    if system == 'Darwin':  # macOS
        try:
            from AppKit import NSAppearance, NSApplication
            app = NSApplication.sharedApplication()
            appearance = app.effectiveAppearance()
            # Check if dark mode is active
            if appearance:
                appearance_name = appearance.name()
                if appearance_name and 'Dark' in appearance_name:
                    return 'dark'
            return 'light'
        except ImportError:
            # Fallback: check environment variable
            import os
            if os.environ.get('APPLE_SSD_APPEARANCE') == 'Dark':
                return 'dark'
            return 'light'
        except Exception:
            logger.warning("Failed to detect macOS theme, defaulting to light")
            return 'light'
    
    elif system == 'Windows':
        try:
            import winreg
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path)
            # AppsUseLightTheme: 0 = dark mode, 1 = light mode
            value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
            winreg.CloseKey(key)
            return 'light' if value == 1 else 'dark'
        except (ImportError, FileNotFoundError, OSError):
            logger.warning("Failed to detect Windows theme, defaulting to light")
            return 'light'
    
    else:  # Linux
        try:
            # Try GTK settings first
            result = subprocess.run(
                ['gsettings', 'get', 'org.gnome.desktop.interface', 'gtk-theme'],
                capture_output=True,
                text=True,
                timeout=1
            )
            if result.returncode == 0:
                theme = result.stdout.strip().lower()
                if 'dark' in theme:
                    return 'dark'
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
            pass
        
        # Fallback: check environment variable
        import os
        color_scheme = os.environ.get('GTK_THEME', '').lower()
        if 'dark' in color_scheme:
            return 'dark'
        
        # Default to light mode
        return 'light'


class DocPrepAPI:
    """
    JavaScript API exposed to the webview frontend.
    All methods here can be called from JavaScript via pywebview.api
    """
    
    def __init__(self):
        self.window: Optional[webview.Window] = None
        self.window_id: Optional[int] = None  # Store window ID instead of object on Windows
        self.input_folder: Optional[Path] = None
        self.output_folder: Optional[Path] = None
        self.extraction_manager: Optional[ExtractionManager] = None
        self.extraction_thread: Optional[threading.Thread] = None
        self.scanner: Optional[FileScanner] = None
        self.extract_pptx_images: bool = False
    
    def set_window(self, window: webview.Window):
        """Set the webview window reference"""
        # On Windows, avoid storing the window object directly to prevent
        # serialization issues when pywebview tries to serialize exceptions
        if platform.system() == 'Windows':
            try:
                # Store index in webview.windows list instead of the object
                windows = webview.windows
                for idx, w in enumerate(windows):
                    if w == window:
                        self.window_id = idx
                        self.window = None  # Don't store object on Windows
                        return
            except Exception:
                # Fallback to storing window if ID lookup fails
                self.window = window
                self.window_id = None
        else:
            # On Mac/Linux, storing the window object is fine
            self.window = window
            self.window_id = None
    
    def _get_window(self) -> Optional[webview.Window]:
        """Get window object in a thread-safe way, avoiding serialization issues on Windows"""
        if platform.system() == 'Windows' and self.window_id is not None:
            try:
                # Get window from webview.windows list by ID to avoid storing reference
                windows = webview.windows
                if self.window_id < len(windows):
                    return windows[self.window_id]
            except Exception:
                pass
        # Fallback to stored window reference (works on Mac/Linux)
        return self.window
    
    def select_folder(self) -> Optional[Dict]:
        """
        Open native folder selection dialog.
        Returns folder info or None if cancelled.
        """
        window = self._get_window()
        if not window:
            return None
        
        result = window.create_file_dialog(
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
    
    def start_extraction(self, extract_pptx_images: bool = False) -> None:
        """
        Start the extraction process in a background thread.
        Progress updates are pushed to JavaScript via evaluate_js.
        
        Args:
            extract_pptx_images: Whether to extract images from PowerPoint files (default False)
        """
        if not self.input_folder or not self.scanner:
            self._call_js('showError', 'No folder selected')
            return
        
        # Store extraction options
        self.extract_pptx_images = extract_pptx_images
        
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
                PowerPointExtractor(self.output_folder, extract_images=self.extract_pptx_images)
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
        """Call a JavaScript function from Python (thread-safe)"""
        # Get window dynamically to avoid serialization issues on Windows
        window = self._get_window()
        if not window:
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
            # On Windows, use webview.windows to avoid storing window reference
            # This prevents serialization issues when errors occur
            if platform.system() == 'Windows':
                # Use the window from webview.windows list
                window.evaluate_js(js_code)
            else:
                # Direct call works fine on Mac/Linux
                window.evaluate_js(js_code)
        except (RuntimeError, AttributeError, TypeError, RecursionError) as e:
            # Suppress pywebview introspection errors on Windows
            # These occur when pywebview tries to serialize window properties for error reporting
            error_str = str(e).lower()
            if any(keyword in error_str for keyword in [
                'maximum recursion depth',
                'corewebview2',
                'com object',
                'no such interface',
                'ui thread',
                'accessibilityobject',
                'recursion'
            ]):
                # These are internal pywebview errors that don't affect functionality
                pass
            else:
                logger.warning(f"Failed to call JS: {e}")
        except Exception as e:
            # Log other unexpected errors
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
        window = self._get_window()
        if window:
            window.minimize()
    
    def toggle_fullscreen(self) -> None:
        """Toggle fullscreen mode"""
        window = self._get_window()
        if window:
            window.toggle_fullscreen()
    
    def close_window(self) -> None:
        """Close the window"""
        window = self._get_window()
        if window:
            # Use a small delay to ensure the JS call completes before destroying
            threading.Thread(target=self._do_close, daemon=True).start()
    
    def _do_close(self) -> None:
        """Actually close the window (called from thread)"""
        import time
        time.sleep(0.05)  # Small delay to let JS complete
        window = self._get_window()
        if window:
            window.destroy()
    
    def get_platform(self) -> str:
        """Return the current platform name"""
        return platform.system()


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
        
        # Detect system theme and set background color accordingly
        theme = detect_system_theme()
        bg_color = '#1e3a5a' if theme == 'dark' else '#ffffff'
        
        # Create the webview window with native frame
        # Set background color to match system theme to prevent color flash on load
        self.window = webview.create_window(
            title='docprep',
            url=str(html_path),
            width=WINDOW_WIDTH,
            height=WINDOW_HEIGHT,
            min_size=(600, 500),
            js_api=self.api,
            background_color=bg_color
        )
        
        # Set window reference in API
        self.api.set_window(self.window)
        
        # Start the webview
        # On Windows, suppress debug output to avoid introspection errors
        if platform.system() == 'Windows':
            webview.start(debug=False, http_server=False)
        else:
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

