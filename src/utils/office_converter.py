import os
import sys
import shutil
import logging
import subprocess
import platform
from pathlib import Path
from typing import Optional, List

logger = logging.getLogger(__name__)

class OfficeConverter:
    """Helper to handle LibreOffice headless conversions"""
    
    def __init__(self):
        self.soffice_path = self._find_soffice()
        
    def _find_soffice(self) -> Optional[str]:
        """
        Locate the soffice binary.
        Checks:
        1. Bundled in app (sys._MEIPASS for PyInstaller)
        2. Standard system locations
        """
        
        # 1. Check bundled path (PyInstaller)
        if getattr(sys, 'frozen', False):
            if platform.system() == 'Darwin':
                # macOS bundle structure: Contents/MacOS/LibreOffice.app/Contents/MacOS/soffice
                # We bundle LibreOffice.app into the root of the app
                bundled_path = Path(sys._MEIPASS) / 'LibreOffice.app' / 'Contents' / 'MacOS' / 'soffice'
                if bundled_path.exists():
                    logger.info(f"Found bundled LibreOffice at: {bundled_path}")
                    return str(bundled_path)
            elif platform.system() == 'Windows':
                # Windows bundle structure: LibreOffice/program/soffice.exe
                bundled_path = Path(sys._MEIPASS) / 'LibreOffice' / 'program' / 'soffice.exe'
                if bundled_path.exists():
                    logger.info(f"Found bundled LibreOffice at: {bundled_path}")
                    return str(bundled_path)

        # 2. Check standard system locations (Fallback for dev mode)
        system = platform.system()
        if system == 'Darwin':
            # Standard macOS install
            paths = [
                '/Applications/LibreOffice.app/Contents/MacOS/soffice',
                str(Path.home() / 'Applications/LibreOffice.app/Contents/MacOS/soffice')
            ]
            for p in paths:
                if os.path.exists(p):
                    return p
                    
        elif system == 'Windows':
            # Check Registry or common paths
            paths = [
                r'C:\Program Files\LibreOffice\program\soffice.exe',
                r'C:\Program Files (x86)\LibreOffice\program\soffice.exe'
            ]
            for p in paths:
                if os.path.exists(p):
                    return p
        
        # 3. Check PATH
        return shutil.which('soffice') or shutil.which('libreoffice')

    def convert_to_png(self, input_path: Path, output_dir: Path) -> List[Path]:
        """
        Convert presentation slides to PNG images.
        Uses PPTX -> PDF -> PNG approach:
        1. Convert PPTX to PDF using LibreOffice (reliable)
        2. Convert PDF pages to PNG using PyMuPDF (fitz)
        This avoids LibreOffice's unreliable PageRange filter for PNG export.
        """
        if not self.soffice_path:
            logger.warning("LibreOffice not found. Cannot perform conversion.")
            return []

        input_path = Path(input_path).absolute()
        output_dir = Path(output_dir).absolute()
        output_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Converting {input_path.name} to PNG via PDF intermediate format...")

        import tempfile
        
        try:
            # Step 1: Convert PPTX to PDF using LibreOffice
            temp_dir = Path(tempfile.mkdtemp(prefix="pptx_to_pdf_"))
            pdf_path = temp_dir / f"{input_path.stem}.pdf"
            
            cmd_pdf = [
                self.soffice_path,
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', str(temp_dir),
                str(input_path)
            ]
            
            result_pdf = subprocess.run(
                cmd_pdf,
                capture_output=True,
                text=True,
                check=True,
                timeout=60
            )
            
            if not pdf_path.exists():
                # LibreOffice might name it differently
                pdf_files = list(temp_dir.glob("*.pdf"))
                if pdf_files:
                    pdf_path = pdf_files[0]
                else:
                    logger.error("PDF conversion failed - no PDF file generated")
                    return []
            
            logger.info(f"Successfully converted to PDF: {pdf_path.name}")
            
            # Step 2: Convert PDF pages to PNG using PyMuPDF (fitz)
            try:
                import fitz  # PyMuPDF
            except ImportError:
                logger.error("PyMuPDF (fitz) not available - cannot convert PDF to PNG")
                return []
            
            doc = fitz.open(pdf_path)
            num_pages = len(doc)
            base_name = input_path.stem
            generated_files = []
            
            logger.info(f"Converting {num_pages} PDF pages to PNG images...")
            
            # Render each page as PNG with high quality
            zoom = 2.0  # 2x zoom for better quality (200% resolution)
            mat = fitz.Matrix(zoom, zoom)
            
            for page_num in range(num_pages):
                page = doc[page_num]
                
                # Render page to pixmap (image)
                pix = page.get_pixmap(matrix=mat)
                
                # Save as PNG
                output_file = output_dir / f"{base_name}_slide_{page_num + 1}.png"
                pix.save(str(output_file))
                generated_files.append(output_file)
                
                logger.debug(f"Converted page {page_num + 1}/{num_pages} to PNG")
            
            doc.close()
            
            # Clean up temp directory
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except:
                pass
            
            logger.info(f"Successfully generated {len(generated_files)} PNG images from {num_pages} slides.")
            return sorted(generated_files)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"LibreOffice PDF conversion failed: {e.stderr}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during conversion: {e}")
            return []



