"""
Configuration settings for DocPrep
"""

import os
from pathlib import Path

# Application metadata
APP_NAME = "DocPrep"
APP_VERSION = "1.0.0"
APP_SUBTITLE = "Convert documents to readable formats"

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    'excel': ['.xlsx', '.xls'],
    'pdf': ['.pdf'],
    'word': ['.docx'],
    'powerpoint': ['.pptx']
}

# Display text for supported formats
SUPPORTED_FORMATS_DISPLAY = "PDF • Excel • Word • PowerPoint"
SUPPORTED_FORMATS_DETAIL = "Supports: PDFs (.pdf), Excel (.xlsx, .xls), Word (.docx), PowerPoint (.pptx)"

# Default settings
DEFAULT_OUTPUT_SUFFIX = "_extracted"

# GUI Settings
WINDOW_WIDTH = 1100
WINDOW_HEIGHT = 850
WINDOW_TITLE = f"{APP_NAME} v{APP_VERSION}"

# Modern minimal color palette
COLOR_PRIMARY = "#4A90E2"        # Soft blue
COLOR_SECONDARY = "#7B8794"      # Cool gray
COLOR_ACCENT = "#5CB3FF"         # Light blue accent
COLOR_SUCCESS = "#52C577"        # Soft green
COLOR_WARNING = "#FFB84D"        # Soft orange
COLOR_ERROR = "#FF6B6B"          # Soft red
COLOR_BACKGROUND = "#FFFFFF"     # Pure white
COLOR_SURFACE = "#F7F9FB"        # Very light blue-gray
COLOR_BORDER = "#E1E8ED"         # Light border
COLOR_TEXT_PRIMARY = "#2C3E50"   # Dark blue-gray
COLOR_TEXT_SECONDARY = "#7B8794" # Medium gray
COLOR_TEXT_TERTIARY = "#A8B2BC"  # Light gray

# Extraction settings
MAX_IMAGE_SIZE = (2048, 2048)  # Maximum size for extracted images
SKIP_EMPTY_SHEETS = True
PRESERVE_FORMATTING = False  # For text extraction

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Update checking - Cloudflare R2
UPDATE_URL = "https://pub-7075773554534e1ea27cd98fe79bcfca.r2.dev/updates.json"

# Google OAuth for desktop app sign-in
# Create at: https://console.cloud.google.com/apis/credentials
# Type: "Desktop app" (auto-allows localhost redirects)
# Note: OAuth credentials have been removed as this project is no longer active
GOOGLE_OAUTH_CLIENT_ID = ""
GOOGLE_OAUTH_CLIENT_SECRET = ""
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

