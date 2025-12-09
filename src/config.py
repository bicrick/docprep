"""
Configuration settings for the Data Extraction Tool
"""

import os
from pathlib import Path

# Application metadata
APP_NAME = "Data Extraction Tool"
APP_VERSION = "1.0.0"

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    'excel': ['.xlsx', '.xls'],
    'pdf': ['.pdf'],
    'word': ['.docx'],
    'powerpoint': ['.pptx']
}

# Default settings
DEFAULT_OUTPUT_SUFFIX = "_extracted"

# GUI Settings
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
WINDOW_TITLE = f"{APP_NAME} v{APP_VERSION}"

# Colors (for GUI)
COLOR_PRIMARY = "#2E5090"
COLOR_SECONDARY = "#4A7BA7"
COLOR_ACCENT = "#7FA9C4"
COLOR_SUCCESS = "#5B9279"
COLOR_ERROR = "#C85450"
COLOR_BACKGROUND = "#F8F9FA"

# Extraction settings
MAX_IMAGE_SIZE = (2048, 2048)  # Maximum size for extracted images
SKIP_EMPTY_SHEETS = True
PRESERVE_FORMATTING = False  # For text extraction

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# File naming
SANITIZE_FILENAMES = True
MAX_FILENAME_LENGTH = 200

def get_all_supported_extensions():
    """Get a flat list of all supported extensions"""
    extensions = []
    for ext_list in SUPPORTED_EXTENSIONS.values():
        extensions.extend(ext_list)
    return extensions

def is_supported_file(filepath):
    """Check if a file is supported for extraction"""
    ext = Path(filepath).suffix.lower()
    return ext in get_all_supported_extensions()

