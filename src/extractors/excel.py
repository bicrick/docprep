"""
Excel extractor - Extract sheets to CSV and charts to PNG
"""

import logging
from pathlib import Path
from typing import Optional
import warnings

import pandas as pd
from PIL import Image
import io

from extractors.base import BaseExtractor, ExtractionResult

warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)


class ExcelExtractor(BaseExtractor):
    """Extract data from Excel files (.xlsx, .xls)"""
    
    SUPPORTED_EXTENSIONS = ['.xlsx', '.xls']
    
    def __init__(self, output_base_path: Path):
        super().__init__(output_base_path)
        
        # Check available engines
        self.xlsx_available = self._check_openpyxl()
        self.xls_available = self._check_xlrd()
    
    def _check_openpyxl(self) -> bool:
        """Check if openpyxl is available for .xlsx files"""
        try:
            import openpyxl
            return True
        except ImportError:
            logger.warning("openpyxl not available - .xlsx files cannot be processed")
            return False
    
    def _check_xlrd(self) -> bool:
        """Check if xlrd is available for .xls files"""
        try:
            import xlrd
            return True
        except ImportError:
            logger.warning("xlrd not available - .xls files cannot be processed")
            return False
    
    def can_extract(self, filepath: Path) -> bool:
        """Check if this extractor can handle the given file"""
        ext = filepath.suffix.lower()
        
        if ext == '.xlsx' and self.xlsx_available:
            return True
        elif ext == '.xls' and self.xls_available:
            return True
        
        return False
    
    def extract(self, filepath: Path, output_dir: Path) -> ExtractionResult:
        """
        Extract all sheets from Excel file to CSV and charts to PNG
        
        Args:
            filepath: Path to Excel file
            output_dir: Directory for extracted files
            
        Returns:
            ExtractionResult with extraction details
        """
        result = ExtractionResult(filepath)
        
        try:
            # Ensure output directory exists
            if not self.ensure_output_dir(output_dir):
                result.add_error(f"Failed to create output directory: {output_dir}")
                return result
            
            # Determine engine based on file extension
            ext = filepath.suffix.lower()
            
            if ext == '.xlsx':
                if not self.xlsx_available:
                    result.add_error("openpyxl not installed - cannot process .xlsx files")
                    return result
                engine = 'openpyxl'
            elif ext == '.xls':
                if not self.xls_available:
                    result.add_error("xlrd not installed - cannot process .xls files")
                    return result
                engine = 'xlrd'
            else:
                result.add_error(f"Unsupported file extension: {ext}")
                return result
            
            logger.info(f"Extracting Excel file: {filepath.name}")
            
            # Create subdirectory for this Excel file
            file_safe_name = self.sanitize_filename(filepath.name)
            file_output_dir = output_dir / file_safe_name
            
            if not self.ensure_output_dir(file_output_dir):
                result.add_error(f"Failed to create output directory: {file_output_dir}")
                return result
            
            # Read Excel file
            excel_file = pd.ExcelFile(filepath, engine=engine)
            sheet_names = excel_file.sheet_names
            
            logger.info(f"Found {len(sheet_names)} sheets: {', '.join(sheet_names)}")
            result.metadata['sheet_count'] = len(sheet_names)
            result.metadata['sheet_names'] = sheet_names
            
            # Extract each sheet
            for sheet_name in sheet_names:
                try:
                    self._extract_sheet(excel_file, sheet_name, file_output_dir, result)
                except Exception as e:
                    error_msg = f"Error extracting sheet '{sheet_name}': {str(e)}"
                    logger.error(error_msg)
                    result.add_warning(error_msg)
            
            # Extract charts if .xlsx file (openpyxl required)
            if ext == '.xlsx' and self.xlsx_available:
                try:
                    self._extract_charts(filepath, file_output_dir, result)
                except Exception as e:
                    error_msg = f"Error extracting charts: {str(e)}"
                    logger.warning(error_msg)
                    result.add_warning(error_msg)
            
            if len(result.extracted_files) > 0:
                result.success = True
                logger.info(f"Successfully extracted {len(result.extracted_files)} files from {filepath.name}")
            else:
                result.add_warning("No data extracted from Excel file")
            
        except Exception as e:
            error_msg = f"Failed to extract {filepath.name}: {str(e)}"
            logger.error(error_msg)
            result.add_error(error_msg)
        
        return result
    
    def _extract_sheet(self, excel_file, sheet_name: str, output_dir: Path, result: ExtractionResult):
        """Extract a single sheet to CSV"""
        logger.debug(f"Reading sheet: {sheet_name}")
        
        # Read the sheet
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        
        # Check if sheet is empty
        if df.empty or df.shape[0] == 0:
            logger.warning(f"Sheet '{sheet_name}' is empty - skipping")
            result.add_warning(f"Sheet '{sheet_name}' is empty")
            return
        
        # Create safe filename for the sheet
        sheet_safe_name = self.sanitize_filename(sheet_name)
        csv_file = output_dir / f"{sheet_safe_name}.csv"
        
        # Save to CSV
        df.to_csv(csv_file, index=False)
        result.add_file(csv_file)
        
        logger.info(f"Extracted sheet '{sheet_name}': {df.shape[0]} rows x {df.shape[1]} cols -> {csv_file.name}")
    
    def _extract_charts(self, filepath: Path, output_dir: Path, result: ExtractionResult):
        """Extract charts from Excel file to PNG images"""
        try:
            import openpyxl
            from openpyxl.chart import (
                AreaChart, BarChart, LineChart, PieChart, 
                ScatterChart, BubbleChart, RadarChart
            )
            from openpyxl.drawing.image import Image as XLImage
        except ImportError:
            logger.warning("openpyxl not available - cannot extract charts")
            return
        
        try:
            # Load workbook
            wb = openpyxl.load_workbook(filepath)
            
            chart_count = 0
            image_count = 0
            
            # Iterate through all sheets
            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                
                # Extract charts
                if hasattr(sheet, '_charts') and sheet._charts:
                    for chart_idx, chart in enumerate(sheet._charts, 1):
                        chart_count += 1
                        chart_filename = f"chart_{chart_count}_{self.sanitize_filename(sheet_name)}.png"
                        chart_path = output_dir / chart_filename
                        
                        # Note: Actually rendering charts from openpyxl is complex
                        # Charts are stored as XML and would need external rendering
                        # For now, we'll log that charts were found
                        logger.info(f"Found chart in sheet '{sheet_name}' (chart rendering not implemented)")
                        result.metadata['charts_found'] = chart_count
                
                # Extract embedded images
                if hasattr(sheet, '_images') and sheet._images:
                    for img_idx, img in enumerate(sheet._images, 1):
                        try:
                            image_count += 1
                            img_filename = f"image_{image_count}_{self.sanitize_filename(sheet_name)}.png"
                            img_path = output_dir / img_filename
                            
                            # Get image data
                            if hasattr(img, '_data'):
                                image_data = img._data()
                                
                                # Save image
                                with open(img_path, 'wb') as f:
                                    f.write(image_data)
                                
                                result.add_file(img_path)
                                logger.info(f"Extracted image from sheet '{sheet_name}' -> {img_filename}")
                        except Exception as e:
                            logger.warning(f"Failed to extract image {img_idx} from sheet '{sheet_name}': {e}")
            
            if chart_count > 0:
                result.metadata['charts_found'] = chart_count
                result.add_warning(f"Found {chart_count} charts (chart rendering requires additional tools)")
            
            if image_count > 0:
                result.metadata['images_extracted'] = image_count
                
        except Exception as e:
            logger.warning(f"Error during chart/image extraction: {e}")
            raise

