"""
Simple test script to verify all components work
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import pandas
        print("✓ pandas")
    except ImportError as e:
        print(f"✗ pandas: {e}")
    
    try:
        import openpyxl
        print("✓ openpyxl")
    except ImportError as e:
        print(f"✗ openpyxl: {e}")
    
    try:
        import xlrd
        print("✓ xlrd")
    except ImportError as e:
        print(f"✗ xlrd: {e}")
    
    try:
        import fitz
        print("✓ PyMuPDF (fitz)")
    except ImportError as e:
        print(f"✗ PyMuPDF (fitz): {e}")
    
    try:
        import docx
        print("✓ python-docx")
    except ImportError as e:
        print(f"✗ python-docx: {e}")
    
    try:
        import pptx
        print("✓ python-pptx")
    except ImportError as e:
        print(f"✗ python-pptx: {e}")
    
    try:
        from PIL import Image
        print("✓ Pillow")
    except ImportError as e:
        print(f"✗ Pillow: {e}")
    
    try:
        import tkinterdnd2
        print("✓ tkinterdnd2 (drag-and-drop)")
    except ImportError as e:
        print(f"⚠ tkinterdnd2 (optional): {e}")
    
    print("\nTesting extractors...")
    
    try:
        from extractors.base import BaseExtractor
        print("✓ Base extractor")
    except ImportError as e:
        print(f"✗ Base extractor: {e}")
    
    try:
        from extractors.excel import ExcelExtractor
        print("✓ Excel extractor")
    except ImportError as e:
        print(f"✗ Excel extractor: {e}")
    
    try:
        from extractors.pdf import PDFExtractor
        print("✓ PDF extractor")
    except ImportError as e:
        print(f"✗ PDF extractor: {e}")
    
    try:
        from extractors.word import WordExtractor
        print("✓ Word extractor")
    except ImportError as e:
        print(f"✗ Word extractor: {e}")
    
    try:
        from extractors.powerpoint import PowerPointExtractor
        print("✓ PowerPoint extractor")
    except ImportError as e:
        print(f"✗ PowerPoint extractor: {e}")
    
    print("\nTesting utilities...")
    
    try:
        from utils.file_scanner import FileScanner, ExtractionManager
        print("✓ File scanner")
    except ImportError as e:
        print(f"✗ File scanner: {e}")
    
    try:
        from utils.report import ReportGenerator
        print("✓ Report generator")
    except ImportError as e:
        print(f"✗ Report generator: {e}")
    
    print("\nTesting GUI...")
    
    try:
        from gui.widgets import DropZone, ProgressFrame, LogTextWidget
        print("✓ GUI widgets")
    except ImportError as e:
        print(f"✗ GUI widgets: {e}")
    
    try:
        from gui.main_window import MainWindow
        print("✓ Main window")
    except ImportError as e:
        print(f"✗ Main window: {e}")
    
    print("\n" + "="*50)
    print("Import test complete!")


if __name__ == "__main__":
    test_imports()

