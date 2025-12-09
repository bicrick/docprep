"""
Custom GUI widgets for the Data Extraction Tool
"""

import tkinter as tk
from tkinter import ttk
import logging

logger = logging.getLogger(__name__)


class LogTextWidget(tk.Text):
    """Text widget for displaying log messages"""
    
    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)
        
        # Configure tags for different log levels
        self.tag_config("INFO", foreground="black")
        self.tag_config("WARNING", foreground="orange")
        self.tag_config("ERROR", foreground="red")
        self.tag_config("SUCCESS", foreground="green")
        
        # Make read-only
        self.config(state='disabled')
    
    def log(self, message: str, level: str = "INFO"):
        """Add a log message"""
        self.config(state='normal')
        self.insert(tk.END, f"{message}\n", level)
        self.see(tk.END)  # Scroll to bottom
        self.config(state='disabled')
        self.update_idletasks()
    
    def clear(self):
        """Clear all log messages"""
        self.config(state='normal')
        self.delete(1.0, tk.END)
        self.config(state='disabled')


class ProgressFrame(ttk.Frame):
    """Frame containing progress bar and status label"""
    
    def __init__(self, parent, **kwargs):
        super().__init__(parent, **kwargs)
        
        # Status label
        self.status_label = ttk.Label(self, text="Ready", font=('Arial', 10))
        self.status_label.pack(fill=tk.X, padx=5, pady=(5, 2))
        
        # Progress bar
        self.progress_bar = ttk.Progressbar(
            self, 
            mode='determinate',
            length=300
        )
        self.progress_bar.pack(fill=tk.X, padx=5, pady=(2, 5))
        
        # Detail label (for file counts, etc.)
        self.detail_label = ttk.Label(self, text="", font=('Arial', 9), foreground='gray')
        self.detail_label.pack(fill=tk.X, padx=5)
        
        self.reset()
    
    def reset(self):
        """Reset progress to initial state"""
        self.progress_bar['value'] = 0
        self.progress_bar['maximum'] = 100
        self.status_label['text'] = "Ready"
        self.detail_label['text'] = ""
    
    def set_status(self, message: str):
        """Update status message"""
        self.status_label['text'] = message
        self.update_idletasks()
    
    def set_detail(self, message: str):
        """Update detail message"""
        self.detail_label['text'] = message
        self.update_idletasks()
    
    def set_progress(self, current: int, total: int):
        """Update progress bar"""
        self.progress_bar['maximum'] = total
        self.progress_bar['value'] = current
        percentage = (current / total * 100) if total > 0 else 0
        self.set_detail(f"{current} / {total} files ({percentage:.1f}%)")
        self.update_idletasks()
    
    def set_indeterminate(self):
        """Set progress bar to indeterminate mode"""
        self.progress_bar['mode'] = 'indeterminate'
        self.progress_bar.start()
    
    def set_determinate(self):
        """Set progress bar to determinate mode"""
        self.progress_bar.stop()
        self.progress_bar['mode'] = 'determinate'


class DropZone(tk.Frame):
    """Drag-and-drop zone for folder selection"""
    
    def __init__(self, parent, callback=None, **kwargs):
        super().__init__(parent, **kwargs)
        
        self.callback = callback
        self.folder_path = None
        
        # Configure appearance
        self.config(
            bg='#F0F0F0',
            relief=tk.RAISED,
            borderwidth=2
        )
        
        # Main label
        self.label = tk.Label(
            self,
            text="Drag & Drop Folder Here\n\nor\n\nClick to Browse",
            font=('Arial', 14),
            bg='#F0F0F0',
            fg='#666666'
        )
        self.label.pack(expand=True, fill=tk.BOTH, padx=20, pady=20)
        
        # Bind click event
        self.bind('<Button-1>', self._on_click)
        self.label.bind('<Button-1>', self._on_click)
        
        # Try to set up drag-and-drop
        self._setup_dnd()
    
    def _setup_dnd(self):
        """Set up drag-and-drop functionality"""
        try:
            from tkinterdnd2 import DND_FILES
            
            # Register as drop target
            self.drop_target_register(DND_FILES)
            self.dnd_bind('<<Drop>>', self._on_drop)
            self.dnd_bind('<<DragEnter>>', self._on_drag_enter)
            self.dnd_bind('<<DragLeave>>', self._on_drag_leave)
            
            logger.info("Drag-and-drop enabled")
        except (ImportError, Exception) as e:
            logger.warning(f"Drag-and-drop not available: {e}")
    
    def _on_click(self, event):
        """Handle click event - open folder browser"""
        from tkinter import filedialog
        
        folder = filedialog.askdirectory(title="Select Folder to Extract")
        if folder:
            self.set_folder(folder)
    
    def _on_drop(self, event):
        """Handle drop event"""
        # Get dropped path
        path = event.data
        
        # Clean up path (remove brackets, quotes)
        path = path.strip('{}').strip('"').strip("'")
        
        # On Mac, paths might be file:// URLs
        if path.startswith('file://'):
            from urllib.parse import unquote
            path = unquote(path[7:])
        
        self.set_folder(path)
        
        # Reset appearance
        self._on_drag_leave(None)
    
    def _on_drag_enter(self, event):
        """Visual feedback when dragging over"""
        self.config(bg='#E0E0FF', relief=tk.SUNKEN)
        self.label.config(bg='#E0E0FF', fg='#000000')
    
    def _on_drag_leave(self, event):
        """Reset appearance when drag leaves"""
        self.config(bg='#F0F0F0', relief=tk.RAISED)
        self.label.config(bg='#F0F0F0', fg='#666666')
    
    def set_folder(self, path: str):
        """Set the selected folder"""
        import os
        
        if not os.path.isdir(path):
            logger.warning(f"Not a directory: {path}")
            return
        
        self.folder_path = path
        
        # Update label with folder name
        folder_name = os.path.basename(path)
        self.label.config(
            text=f"Selected Folder:\n\n{folder_name}\n\n{path}",
            font=('Arial', 11),
            fg='#000000'
        )
        
        # Call callback if provided
        if self.callback:
            self.callback(path)
    
    def clear(self):
        """Clear the selected folder"""
        self.folder_path = None
        self.label.config(
            text="Drag & Drop Folder Here\n\nor\n\nClick to Browse",
            font=('Arial', 14),
            fg='#666666'
        )
    
    def disable(self):
        """Disable the drop zone"""
        # Unbind events
        self.unbind('<Button-1>')
        self.label.unbind('<Button-1>')
        
        # Visual feedback - grayed out
        self.config(bg='#E0E0E0', relief=tk.FLAT)
        self.label.config(bg='#E0E0E0', fg='#999999')
    
    def enable(self):
        """Enable the drop zone"""
        # Rebind events
        self.bind('<Button-1>', self._on_click)
        self.label.bind('<Button-1>', self._on_click)
        
        # Restore normal appearance
        self.config(bg='#F0F0F0', relief=tk.RAISED)
        self.label.config(bg='#F0F0F0', fg='#666666')

