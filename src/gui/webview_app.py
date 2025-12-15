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
import os
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


def get_storage_path():
    """
    Get the platform-specific path for persistent webview storage (localStorage, etc.)
    This enables Firebase auth persistence across app restarts.
    """
    app_name = "docprep"
    
    # Use os.path.expanduser for reliable home directory detection in bundled apps
    home = os.path.expanduser('~')
    
    if platform.system() == 'Darwin':  # macOS
        base = os.path.join(home, 'Library', 'Application Support')
    elif platform.system() == 'Windows':
        base = os.environ.get('APPDATA', home)
    else:  # Linux and others
        base = os.path.join(home, '.local', 'share')
    
    storage_dir = os.path.join(base, app_name)
    
    # Ensure the directory exists
    try:
        os.makedirs(storage_dir, exist_ok=True)
        logger.info(f"Webview storage path: {storage_dir}")
    except Exception as e:
        logger.warning(f"Could not create storage directory {storage_dir}: {e}")
        # Fall back to a temp directory if we can't create the preferred one
        import tempfile
        storage_dir = os.path.join(tempfile.gettempdir(), app_name)
        os.makedirs(storage_dir, exist_ok=True)
        logger.info(f"Using fallback storage path: {storage_dir}")
    
    return storage_dir


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
                        break
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
    
    def setup_drag_drop_handlers(self):
        """Set up drag-and-drop event handlers using pywebview's DOM API
        This should be called after the window is ready (in the start callback)"""
        window = self._get_window()
        if not window:
            logger.warning("Cannot set up drag-and-drop: window not available")
            return
            
        try:
            from webview.dom import DOMEventHandler
            
            def on_drag(e):
                """Handle drag events (dragenter, dragover, dragstart)"""
                # Prevent default to allow drop
                pass
            
            def on_drop(e):
                """Handle drop event and extract file paths"""
                files = e.get('dataTransfer', {}).get('files', [])
                
                if len(files) == 0:
                    logger.warning("Drop event with no files")
                    return
                
                # Get the first file's full path using pywebview's special property
                first_file = files[0]
                path = first_file.get('pywebviewFullPath')
                
                if not path:
                    logger.warning("Could not get pywebviewFullPath from dropped file")
                    logger.info(f"Dropped file name: {first_file.get('name', 'unknown')}")
                    return
                
                logger.info(f"File dropped: {path}")
                
                # Validate and set the folder
                result = self.validate_folder(path)
                
                if result:
                    # Call JavaScript to update the UI
                    self._call_js('window.handleFolderDrop', result)
                else:
                    logger.warning(f"Invalid folder path from drop: {path}")
            
            # Bind event handlers to the document
            window.dom.document.events.dragenter += DOMEventHandler(on_drag, True, True)
            window.dom.document.events.dragstart += DOMEventHandler(on_drag, True, True)
            window.dom.document.events.dragover += DOMEventHandler(on_drag, True, True, debounce=500)
            window.dom.document.events.drop += DOMEventHandler(on_drop, True, True)
            
            logger.info("Drag-and-drop handlers registered successfully")
            
        except ImportError:
            logger.warning("DOM API not available - drag-and-drop will not work")
        except Exception as e:
            logger.warning(f"Failed to set up drag-and-drop handlers: {e}")
    
    def select_folder(self) -> Optional[Dict]:
        """
        Open native folder selection dialog.
        Returns folder info or None if cancelled.
        """
        window = self._get_window()
        if not window:
            return None
        
        result = window.create_file_dialog(
            webview.FileDialog.FOLDER,
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
        try:
            folder_path = Path(path)
            
            # Handle file:// URLs that might come from drag-and-drop
            if path.startswith('file://'):
                import urllib.parse
                path = urllib.parse.unquote(path.replace('file://', ''))
                folder_path = Path(path)
            
            if folder_path.exists() and folder_path.is_dir():
                return self._get_folder_info(str(folder_path))
            
            # If a file was dropped, use its parent directory
            if folder_path.exists() and folder_path.is_file():
                return self._get_folder_info(str(folder_path.parent))
                
        except Exception as e:
            logger.warning(f"Failed to validate folder path '{path}': {e}")
        
        return None
    
    def browse_output_folder(self) -> Optional[Dict]:
        """
        Open native folder selection dialog for output folder location.
        The selected folder becomes the PARENT where the output folder will be created.
        Returns folder info with parent_path and children_names (for validation).
        """
        window = self._get_window()
        if not window:
            return None
        
        # Start from the current parent path if available
        start_dir = str(self.input_folder.parent) if self.input_folder else ''
        
        result = window.create_file_dialog(
            webview.FileDialog.FOLDER,
            directory=start_dir,
            allow_multiple=False
        )
        
        if result and len(result) > 0:
            selected_folder = Path(result[0])
            
            # The selected folder becomes the parent where output will be created
            # Get children names of the selected folder for validation
            children_names = []
            try:
                for item in selected_folder.iterdir():
                    children_names.append(item.name)
            except (PermissionError, OSError):
                pass
            
            return {
                'parent_path': str(selected_folder),
                'children_names': children_names
            }
        
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
        
        # Get sibling folder/file names in the parent directory for validation
        parent_path = path.parent
        sibling_names = []
        try:
            for item in parent_path.iterdir():
                sibling_names.append(item.name)
        except (PermissionError, OSError):
            # If we can't read the parent directory, just continue
            pass
        
        return {
            'path': str(path),
            'name': path.name,
            'parent_path': str(parent_path),
            'sibling_names': sibling_names,
            'file_count': scan_results['supported_count']
        }
    
    def start_extraction(self, extract_pptx_images: bool = False, output_folder_path: str = None) -> None:
        """
        Start the extraction process in a background thread.
        Progress updates are pushed to JavaScript via evaluate_js.
        
        Args:
            extract_pptx_images: Whether to extract images from PowerPoint files (default False)
            output_folder_path: Full path for the output folder (optional)
        """
        if not self.input_folder or not self.scanner:
            self._call_js('showError', 'No folder selected')
            return
        
        # Store extraction options
        self.extract_pptx_images = extract_pptx_images
        
        # Set output folder with custom path if provided
        if output_folder_path:
            self.output_folder = Path(output_folder_path)
        else:
            self.output_folder = Path(str(self.input_folder) + DEFAULT_OUTPUT_SUFFIX)
        
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
                file_callback=self._on_file_start,
                substep_callback=self._on_substep
            )
            
            # Check if cancelled (but not skipped - skip shows summary)
            if extraction_summary.get('cancelled') and not extraction_summary.get('skipped'):
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
            
            # Show completion (or summary if skipped)
            # If skipped, use processed_count (actual files processed) instead of total_processed
            if extraction_summary.get('skipped'):
                # When skipped, show actual processed count, not total
                processed_count = extraction_summary.get('processed_count', extraction_summary['successful'] + extraction_summary['failed'])
            else:
                processed_count = extraction_summary['total_processed']
            
            # Build detailed results lists from extraction results
            succeeded_list = []
            warnings_list = []
            failed_list = []
            
            for result in self.extraction_manager.results:
                file_info = {
                    'file': result.source_file.name,
                    'path': str(result.source_file)
                }
                
                if result.success and not result.warnings:
                    # Succeeded without warnings
                    file_info['outputs'] = [f.name for f in result.extracted_files]
                    file_info['output_count'] = len(result.extracted_files)
                    succeeded_list.append(file_info)
                elif result.success and result.warnings:
                    # Succeeded with warnings
                    file_info['outputs'] = [f.name for f in result.extracted_files]
                    file_info['output_count'] = len(result.extracted_files)
                    file_info['messages'] = result.warnings
                    warnings_list.append(file_info)
                else:
                    # Failed
                    file_info['errors'] = result.errors
                    failed_list.append(file_info)
            
            results = {
                'processed': processed_count,
                'extracted': extraction_summary['total_files_extracted'],
                'succeeded': succeeded_list,
                'warnings': warnings_list,
                'failed': failed_list,
                'skipped': []  # Files that weren't processed due to skip/cancel
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
    
    def _on_substep(self, message: str):
        """Substep callback - push sub-step progress to JavaScript"""
        self._call_js('updateSubStep', message)
    
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
    
    def skip_extraction(self) -> None:
        """Skip remaining files and show summary with current progress"""
        if self.extraction_manager:
            self.extraction_manager.skip()
            logger.info("Extraction skip requested - will show summary with current progress")
    
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
    
    def open_in_editor(self, editor: str) -> Optional[Dict]:
        """
        Open the output folder in a code editor.
        
        Args:
            editor: Editor name ('cursor', 'windsurf', or 'antigravity')
            
        Returns:
            None on success, or dict with 'error' key on failure
        """
        if not self.output_folder or not self.output_folder.exists():
            return {'error': 'Output folder does not exist'}
        
        folder_path = str(self.output_folder)
        
        # Editor configurations for different platforms
        editor_configs = {
            'cursor': {
                'Darwin': {
                    'app': '/Applications/Cursor.app',
                    'cli': 'cursor'
                },
                'Windows': {
                    'cli': 'cursor'
                }
            },
            'windsurf': {
                'Darwin': {
                    'app': '/Applications/Windsurf.app',
                    'cli': 'windsurf'
                },
                'Windows': {
                    'cli': 'windsurf'
                }
            },
            'antigravity': {
                'Darwin': {
                    'app': '/Applications/Antigravity.app',
                    'cli': 'antigravity'
                },
                'Windows': {
                    'cli': 'antigravity'
                }
            }
        }
        
        if editor not in editor_configs:
            return {'error': f'Unknown editor: {editor}'}
        
        config = editor_configs[editor]
        system = platform.system()
        
        if system not in config:
            return {'error': f'{editor} is not supported on {system}'}
        
        platform_config = config[system]
        
        try:
            import shutil
            import shlex
            
            if system == 'Darwin':
                # macOS: Try CLI first, then fall back to 'open' command
                cli = platform_config.get('cli')
                app_path = platform_config.get('app')
                
                # Check if CLI is available using shutil.which (handles PATH properly)
                cli_path = shutil.which(cli) if cli else None
                
                # Use shlex.quote to properly escape paths with spaces for shell execution
                quoted_path = shlex.quote(folder_path)
                
                if cli_path:
                    # Use shell=True with properly quoted path to handle spaces
                    cmd = f'{shlex.quote(cli_path)} --new-window {quoted_path}'
                    subprocess.Popen(cmd, shell=True)
                    logger.info(f"Opened '{folder_path}' in {editor} via CLI (new window)")
                elif app_path and Path(app_path).exists():
                    # Use macOS 'open' command with properly quoted paths
                    cmd = f'open -n -a {shlex.quote(app_path)} {quoted_path}'
                    subprocess.Popen(cmd, shell=True)
                    logger.info(f"Opened '{folder_path}' in {editor} via open -a (new instance)")
                else:
                    return {'error': f'{editor.title()} is not installed'}
                    
            elif system == 'Windows':
                cli = platform_config.get('cli')
                if cli:
                    # Check if CLI is available
                    cli_path = shutil.which(cli)
                    if cli_path:
                        # On Windows, wrap path in double quotes for shell
                        # Windows uses different quoting than Unix
                        quoted_path = f'"{folder_path}"'
                        cmd = f'"{cli_path}" --new-window {quoted_path}'
                        subprocess.Popen(cmd, shell=True)
                        logger.info(f"Opened '{folder_path}' in {editor} (new window)")
                    else:
                        return {'error': f'{editor.title()} is not installed or not in PATH'}
                else:
                    return {'error': f'{editor.title()} CLI not configured for Windows'}
            else:
                return {'error': f'{editor} is not supported on {system}'}
                
            return None  # Success
            
        except Exception as e:
            logger.warning(f"Failed to open in {editor}: {e}")
            return {'error': str(e)}
    
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
    
    def check_libreoffice_available(self) -> bool:
        """Check if LibreOffice is available on the system"""
        from utils.office_converter import OfficeConverter
        converter = OfficeConverter()
        return converter.soffice_path is not None
    
    def check_for_updates(self) -> Optional[Dict]:
        """
        Check for available updates.
        
        Returns:
            Dictionary with update info if available, None otherwise.
            Keys: version, download_url, release_notes, is_newer
        """
        from config import APP_VERSION, UPDATE_URL
        from utils.update_checker import get_update_info_dict
        
        return get_update_info_dict(APP_VERSION, UPDATE_URL)
    
    def open_download_url(self, url: str) -> None:
        """Open a URL in the default browser (for downloading updates)"""
        import webbrowser
        webbrowser.open(url)
    
    def start_google_signin(self) -> None:
        """
        Start Google OAuth flow in the system browser.
        Opens browser for sign-in and waits for callback.
        Results are pushed back to JavaScript.
        """
        # Run in background thread to not block UI
        oauth_thread = threading.Thread(
            target=self._run_google_oauth,
            daemon=True
        )
        oauth_thread.start()
    
    def _run_google_oauth(self) -> None:
        """Run the Google OAuth flow (called in background thread)"""
        try:
            from utils.oauth_server import OAuthServer
            from config import GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
            import urllib.request
            import urllib.parse
            import json
            import secrets
            import hashlib
            import base64
            
            if not GOOGLE_OAUTH_CLIENT_ID:
                self._call_js('googleSignInError', 'Google OAuth not configured. Set GOOGLE_OAUTH_CLIENT_ID in config.py')
                return
            
            CLIENT_ID = GOOGLE_OAUTH_CLIENT_ID
            CLIENT_SECRET = GOOGLE_OAUTH_CLIENT_SECRET
            
            # Start local callback server
            server = OAuthServer(port=8547)
            server.start()
            
            # Use consistent redirect URI
            redirect_uri = "http://127.0.0.1:8547/callback"
            
            # Generate PKCE code verifier and challenge
            code_verifier = secrets.token_urlsafe(43)  # 43 chars gives 32 bytes when decoded
            code_challenge = base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode()).digest()
            ).rstrip(b'=').decode()
            
            logger.info(f"OAuth redirect_uri: {redirect_uri}")
            logger.info(f"PKCE verifier length: {len(code_verifier)}, challenge length: {len(code_challenge)}")
            
            # Build OAuth URL with PKCE
            params = {
                "client_id": CLIENT_ID,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "email profile openid",
                "code_challenge": code_challenge,
                "code_challenge_method": "S256",
                "access_type": "offline",
                "prompt": "select_account"
            }
            
            oauth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
            
            # Open browser
            import webbrowser
            webbrowser.open(oauth_url)
            
            # Wait for callback (5 minute timeout)
            auth_code, error = server.wait_for_callback(timeout=300)
            server.stop()
            
            if error:
                self._call_js('googleSignInError', error)
                return
            
            if not auth_code:
                self._call_js('googleSignInError', 'No authorization code received')
                return
            
            logger.info(f"Got auth code, length: {len(auth_code)}")
            
            # Exchange code for tokens using PKCE
            token_url = "https://oauth2.googleapis.com/token"
            token_params = {
                "client_id": CLIENT_ID,
                "code": auth_code,
                "code_verifier": code_verifier,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            if CLIENT_SECRET:
                token_params["client_secret"] = CLIENT_SECRET
            token_data = urllib.parse.urlencode(token_params).encode()
            
            logger.info(f"Token request redirect_uri: {redirect_uri}, has_secret: {bool(CLIENT_SECRET)}")
            
            req = urllib.request.Request(token_url, data=token_data, method="POST")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
            
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    tokens = json.loads(response.read().decode())
            except urllib.error.HTTPError as e:
                error_body = e.read().decode()
                logger.error(f"Token exchange failed: {e.code} - {error_body}")
                self._call_js('googleSignInError', f"Token exchange failed: {error_body}")
                return
            
            id_token = tokens.get("id_token")
            access_token = tokens.get("access_token")
            
            if not id_token:
                self._call_js('googleSignInError', 'No ID token received from Google')
                return
            
            logger.info("Successfully got tokens from Google")
            
            # Send tokens to JavaScript for Firebase sign-in
            self._call_js('googleSignInSuccess', {
                'idToken': id_token,
                'accessToken': access_token
            })
            
        except Exception as e:
            logger.error(f"Google OAuth failed: {e}")
            self._call_js('googleSignInError', str(e))
    
    def download_and_install_update(self) -> None:
        """
        Download update, install with admin privileges, and relaunch.
        Progress is pushed to JavaScript via callbacks.
        
        This runs in a background thread to avoid blocking the UI.
        """
        # Start in background thread
        update_thread = threading.Thread(
            target=self._run_update_installation,
            daemon=True
        )
        update_thread.start()
    
    def _run_update_installation(self) -> None:
        """Run the update installation process (called in background thread)"""
        try:
            from utils.auto_updater import download_update, install_update, relaunch_app
            from config import APP_VERSION, UPDATE_URL
            from utils.update_checker import get_update_info_dict
            
            # Get update info to get download URL
            update_info = get_update_info_dict(APP_VERSION, UPDATE_URL)
            if not update_info or not update_info.get('download_url'):
                self._call_js('updateInstallError', 'Could not get update information')
                return
            
            download_url = update_info['download_url']
            
            # Define progress callback to push to JS
            def on_download_progress(downloaded: int, total: int):
                percent = int((downloaded / total) * 100) if total > 0 else 0
                self._call_js('updateDownloadProgress', percent)
            
            # Download the update
            self._call_js('updateDownloadProgress', 0)
            dmg_path = download_update(download_url, progress_callback=on_download_progress)
            
            if not dmg_path:
                self._call_js('updateInstallError', 'Download failed')
                return
            
            # Signal download complete, starting install
            self._call_js('updateInstallStarted')
            
            # Install the update (will prompt for admin password)
            success = install_update(dmg_path)
            
            if not success:
                self._call_js('updateInstallError', 'Installation cancelled or failed')
                return
            
            # Installation succeeded - relaunch
            self._call_js('updateInstallComplete')
            
            # Small delay to let JS update, then relaunch
            import time
            time.sleep(0.5)
            relaunch_app()
            
        except Exception as e:
            logger.error(f"Update installation failed: {e}")
            self._call_js('updateInstallError', str(e))


class WebviewApp:
    """Main application class for the PyWebview-based GUI"""
    
    # Set to True during development to use Vite dev server (npm run dev)
    # Set to False for production to use built files (npm run build)
    DEV_MODE = False
    DEV_SERVER_URL = 'http://localhost:5173'
    
    def __init__(self):
        self.api = DocPrepAPI()
        self.window: Optional[webview.Window] = None
    
    def run(self):
        """Start the application"""
        logger.info(f"Starting {APP_NAME} v{APP_VERSION}")
        
        # Get the path to the web assets
        # Handle both development and PyInstaller frozen app scenarios
        if getattr(sys, 'frozen', False):
            # Running as PyInstaller bundle
            base_path = Path(sys._MEIPASS)
            web_dir = base_path / 'gui' / 'web'
        else:
            # Running as normal Python script
            current_dir = Path(__file__).parent
            web_dir = current_dir / 'web'
        
        # Choose URL based on mode
        if self.DEV_MODE:
            # Development mode: use Vite dev server for hot reload
            # Run "npm run dev" in src/gui/web first
            url = self.DEV_SERVER_URL
            logger.info(f"Running in DEV mode - connecting to {url}")
        else:
            # Production mode: use built files from dist/
            dist_dir = web_dir / 'dist'
            if dist_dir.exists():
                html_path = dist_dir / 'index.html'
                logger.info(f"Running in PRODUCTION mode - using {html_path}")
            else:
                # Fallback to old index.html if dist not built
                html_path = web_dir / 'index.html'
                logger.warning(f"dist/ not found, falling back to {html_path}")
            url = str(html_path)
        
        # Detect system theme and set background color accordingly
        theme = detect_system_theme()
        bg_color = '#1e3a5a' if theme == 'dark' else '#ffffff'
        
        # Create the webview window with native frame
        # Set background color to match system theme to prevent color flash on load
        self.window = webview.create_window(
            title='',
            url=url,
            width=WINDOW_WIDTH,
            height=WINDOW_HEIGHT,
            min_size=(600, 500),
            js_api=self.api,
            background_color=bg_color
        )
        
        # Set window reference in API
        self.api.set_window(self.window)
        
        # Define callback to set up drag-and-drop after window is ready
        def on_ready():
            self.api.setup_drag_drop_handlers()
        
        # Start the webview with persistent storage for localStorage (auth persistence)
        # private_mode=False is required to persist localStorage/cookies between sessions
        storage_path = get_storage_path()
        
        # On Windows, suppress debug output to avoid introspection errors
        if platform.system() == 'Windows':
            webview.start(on_ready, debug=False, http_server=False, private_mode=False, storage_path=storage_path)
        else:
            webview.start(on_ready, debug=False, private_mode=False, storage_path=storage_path)


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

