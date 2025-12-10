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
        Uses LibreOffice headless mode.
        """
        if not self.soffice_path:
            logger.warning("LibreOffice not found. Cannot perform conversion.")
            return []

        input_path = Path(input_path).absolute()
        output_dir = Path(output_dir).absolute()
        output_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Converting {input_path.name} to PNG using LibreOffice...")

        # Command: soffice --headless --convert-to 'png:impress_png_Export:{"ExportOnlyBackground":false,"PageRange":"1-"}' --outdir <out> <in>
        # Note: The filter options JSON is specific to LibreOffice 7.4+ for multi-page export
        # If older versions are used, this might only export the first page.
        
        cmd = [
            self.soffice_path,
            '--headless',
            '--convert-to', 
            'png:impress_png_Export:{"ExportOnlyBackground":false,"PageRange":"1-"}',
            '--outdir', str(output_dir),
            str(input_path)
        ]

        try:
            # Run conversion
            # Capture output for debugging
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                check=True
            )
            logger.debug(f"LibreOffice Output: {result.stdout}")
            
            # LibreOffice often names files like 'filename.png' (first slide) or 'filename_Page_1.png'
            # We need to collect what was generated
            generated_files = sorted(list(output_dir.glob("*.png")))
            
            # Filter to only files that match the input basename (approximate match)
            # This is to avoid picking up old files if the dir wasn't empty
            base_name = input_path.stem
            relevant_files = [f for f in generated_files if base_name in f.name]
            
            logger.info(f"Generated {len(relevant_files)} slide images.")
            return relevant_files

        except subprocess.CalledProcessError as e:
            logger.error(f"LibreOffice conversion failed: {e.stderr}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during conversion: {e}")
            return []



