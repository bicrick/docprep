"""
Main application window for Data Extraction Tool
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path
import threading
import logging

from gui.widgets import DropZone, ProgressFrame, LogTextWidget
from config import WINDOW_WIDTH, WINDOW_HEIGHT, WINDOW_TITLE, DEFAULT_OUTPUT_SUFFIX
from utils.file_scanner import FileScanner, ExtractionManager
from utils.report import ReportGenerator
from extractors.excel import ExcelExtractor
from extractors.pdf import PDFExtractor
from extractors.word import WordExtractor
from extractors.powerpoint import PowerPointExtractor

logger = logging.getLogger(__name__)


class MainWindow:
    """Main application window"""
    
    def __init__(self):
        # Try to use tkinterdnd2 if available
        try:
            from tkinterdnd2 import TkinterDnD
            self.root = TkinterDnD.Tk()
            self.dnd_available = True
            logger.info("Using TkinterDnD for drag-and-drop")
        except ImportError:
            self.root = tk.Tk()
            self.dnd_available = False
            logger.warning("TkinterDnD not available - drag-and-drop disabled")
        
        self.root.title(WINDOW_TITLE)
        self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        
        # State variables
        self.input_folder = None
        self.output_folder = None
        self.extraction_thread = None
        self.extraction_manager = None
        
        # Setup GUI
        self._setup_gui()
        
        # Setup logging handler
        self._setup_logging()
    
    def _setup_gui(self):
        """Setup all GUI components"""
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        
        # Title
        title_label = ttk.Label(
            main_frame,
            text="Data Extraction Tool",
            font=('Arial', 16, 'bold')
        )
        title_label.grid(row=0, column=0, pady=(0, 10))
        
        # Drop zone
        self.drop_zone = DropZone(
            main_frame,
            callback=self._on_folder_selected,
            height=150
        )
        self.drop_zone.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=10)
        
        # Output folder selection
        output_frame = ttk.Frame(main_frame)
        output_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=5)
        output_frame.columnconfigure(1, weight=1)
        
        ttk.Label(output_frame, text="Output:").grid(row=0, column=0, padx=(0, 5))
        
        self.output_entry = ttk.Entry(output_frame)
        self.output_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=5)
        self.output_entry.insert(0, "(Auto-generated)")
        self.output_entry.config(state='readonly')
        
        self.output_btn = ttk.Button(
            output_frame,
            text="Browse...",
            command=self._browse_output
        )
        self.output_btn.grid(row=0, column=2)
        
        # Options frame
        options_frame = ttk.LabelFrame(main_frame, text="Options", padding="5")
        options_frame.grid(row=3, column=0, sticky=(tk.W, tk.E), pady=5)
        
        self.open_after_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            options_frame,
            text="Open output folder when complete",
            variable=self.open_after_var
        ).pack(anchor=tk.W)
        
        # Action buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=4, column=0, pady=10)
        
        self.extract_btn = ttk.Button(
            button_frame,
            text="Start Extraction",
            command=self._start_extraction,
            state='disabled'
        )
        self.extract_btn.pack(side=tk.LEFT, padx=5)
        
        self.cancel_btn = ttk.Button(
            button_frame,
            text="Cancel",
            command=self._cancel_extraction,
            state='disabled'
        )
        self.cancel_btn.pack(side=tk.LEFT, padx=5)
        
        # Progress frame
        self.progress_frame = ProgressFrame(main_frame)
        self.progress_frame.grid(row=5, column=0, sticky=(tk.W, tk.E), pady=5)
        
        # Log area
        log_frame = ttk.LabelFrame(main_frame, text="Log", padding="5")
        log_frame.grid(row=6, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
        main_frame.rowconfigure(6, weight=1)
        
        # Log text with scrollbar
        log_scroll = ttk.Scrollbar(log_frame)
        log_scroll.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        self.log_text = LogTextWidget(
            log_frame,
            height=10,
            yscrollcommand=log_scroll.set
        )
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        log_scroll.config(command=self.log_text.yview)
    
    def _setup_logging(self):
        """Setup logging to GUI"""
        class GUILogHandler(logging.Handler):
            def __init__(self, log_widget):
                super().__init__()
                self.log_widget = log_widget
            
            def emit(self, record):
                msg = self.format(record)
                level = record.levelname
                
                # Map logging levels to widget levels
                if level == 'INFO':
                    widget_level = 'INFO'
                elif level == 'WARNING':
                    widget_level = 'WARNING'
                elif level == 'ERROR':
                    widget_level = 'ERROR'
                else:
                    widget_level = 'INFO'
                
                # Schedule GUI update in main thread
                try:
                    self.log_widget.log(msg, widget_level)
                except:
                    pass  # Ignore errors during logging
        
        # Add handler to root logger
        gui_handler = GUILogHandler(self.log_text)
        gui_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
        logging.getLogger().addHandler(gui_handler)
        logging.getLogger().setLevel(logging.INFO)
    
    def _on_folder_selected(self, path: str):
        """Handle folder selection"""
        self.input_folder = Path(path)
        logger.info(f"Selected folder: {self.input_folder}")
        
        # Enable extract button
        self.extract_btn.config(state='normal')
        
        # Set default output folder
        if not self.output_folder:
            default_output = Path(str(self.input_folder) + DEFAULT_OUTPUT_SUFFIX)
            self.output_entry.config(state='normal')
            self.output_entry.delete(0, tk.END)
            self.output_entry.insert(0, str(default_output))
            self.output_entry.config(state='readonly')
    
    def _browse_output(self):
        """Browse for output folder"""
        folder = filedialog.askdirectory(title="Select Output Folder")
        if folder:
            self.output_folder = Path(folder)
            self.output_entry.config(state='normal')
            self.output_entry.delete(0, tk.END)
            self.output_entry.insert(0, str(self.output_folder))
            self.output_entry.config(state='readonly')
    
    def _start_extraction(self):
        """Start the extraction process"""
        if not self.input_folder:
            messagebox.showerror("Error", "Please select an input folder")
            return
        
        # Get output folder
        output_path = self.output_entry.get()
        if output_path == "(Auto-generated)":
            output_path = str(self.input_folder) + DEFAULT_OUTPUT_SUFFIX
        
        self.output_folder = Path(output_path)
        
        # Disable controls
        self.extract_btn.config(state='disabled')
        self.cancel_btn.config(state='normal')
        self.drop_zone.disable()
        self.output_btn.config(state='disabled')
        
        # Clear log
        self.log_text.clear()
        self.progress_frame.reset()
        
        # Start extraction in separate thread
        self.extraction_thread = threading.Thread(
            target=self._run_extraction,
            daemon=True
        )
        self.extraction_thread.start()
    
    def _run_extraction(self):
        """Run extraction process (in separate thread)"""
        try:
            # Scan files
            self.progress_frame.set_status("Scanning folder...")
            self.progress_frame.set_indeterminate()
            
            scanner = FileScanner(self.input_folder)
            scan_results = scanner.scan()
            
            self.progress_frame.set_determinate()
            logger.info(f"Found {scan_results['supported_count']} files to extract")
            
            if scan_results['supported_count'] == 0:
                logger.warning("No supported files found!")
                self._extraction_complete(None, scan_results, None)
                return
            
            # Create extractors
            extractors = [
                ExcelExtractor(self.output_folder),
                PDFExtractor(self.output_folder),
                WordExtractor(self.output_folder),
                PowerPointExtractor(self.output_folder)
            ]
            
            # Create extraction manager
            self.extraction_manager = ExtractionManager(scanner, extractors)
            
            # Extract files
            self.progress_frame.set_status("Extracting files...")
            
            extraction_summary = self.extraction_manager.extract_all(
                self.output_folder,
                progress_callback=self._update_progress,
                file_callback=self._update_current_file
            )
            
            # Generate report
            self.progress_frame.set_status("Generating report...")
            report_path = ReportGenerator.generate_summary_report(
                self.output_folder,
                scan_results,
                extraction_summary,
                self.extraction_manager.results
            )
            
            # Complete
            self._extraction_complete(extraction_summary, scan_results, report_path)
            
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            messagebox.showerror("Error", f"Extraction failed: {str(e)}")
            self._reset_gui()
    
    def _update_progress(self, current: int, total: int):
        """Update progress (called from extraction thread)"""
        self.root.after(0, lambda: self.progress_frame.set_progress(current, total))
    
    def _update_current_file(self, filepath: Path, current: int, total: int):
        """Update current file being processed"""
        msg = f"Processing ({current}/{total}): {filepath.name}"
        self.root.after(0, lambda: self.progress_frame.set_status(msg))
    
    def _extraction_complete(self, summary, scan_results, report_path):
        """Handle extraction completion"""
        self.root.after(0, lambda: self._show_completion_dialog(summary, scan_results, report_path))
    
    def _show_completion_dialog(self, summary, scan_results, report_path):
        """Show completion dialog (must be called in main thread)"""
        if summary and not summary.get('cancelled'):
            self.progress_frame.set_status("Extraction complete!")
            self.progress_frame.set_progress(100, 100)
            
            message = (
                f"Extraction complete!\n\n"
                f"Files processed: {summary['successful']} / {summary['total_processed']}\n"
                f"Total files extracted: {summary['total_files_extracted']}\n"
                f"Failed: {summary['failed']}\n"
                f"Warnings: {summary['warnings']}\n\n"
                f"Output: {self.output_folder}"
            )
            
            logger.info("Extraction complete!")
            messagebox.showinfo("Complete", message)
            
            # Open output folder if requested
            if self.open_after_var.get():
                self._open_folder(self.output_folder)
        elif summary and summary.get('cancelled'):
            self.progress_frame.set_status("Cancelled")
            logger.info("Extraction cancelled")
            messagebox.showinfo("Cancelled", "Extraction was cancelled")
        else:
            self.progress_frame.set_status("No files to extract")
            messagebox.showinfo("Complete", "No supported files found to extract")
        
        self._reset_gui()
    
    def _cancel_extraction(self):
        """Cancel the extraction process"""
        if self.extraction_manager:
            self.extraction_manager.cancel()
            logger.info("Cancelling extraction...")
            self.cancel_btn.config(state='disabled')
    
    def _reset_gui(self):
        """Reset GUI to initial state"""
        self.extract_btn.config(state='normal' if self.input_folder else 'disabled')
        self.cancel_btn.config(state='disabled')
        self.drop_zone.enable()
        self.output_btn.config(state='normal')
    
    def _open_folder(self, path: Path):
        """Open folder in file explorer"""
        import subprocess
        import platform
        
        try:
            if platform.system() == 'Darwin':  # macOS
                subprocess.run(['open', str(path)])
            elif platform.system() == 'Windows':
                subprocess.run(['explorer', str(path)])
            else:  # Linux
                subprocess.run(['xdg-open', str(path)])
        except Exception as e:
            logger.warning(f"Failed to open folder: {e}")
    
    def run(self):
        """Start the GUI event loop"""
        logger.info("Starting Data Extraction Tool")
        self.log_text.log("Welcome to Data Extraction Tool", "SUCCESS")
        self.log_text.log("Drag and drop a folder or click to browse", "INFO")
        self.root.mainloop()

