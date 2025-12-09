"""
PDF extractor - Extract text and embedded images from PDFs
"""

import logging
from pathlib import Path
from typing import Optional

from extractors.base import BaseExtractor, ExtractionResult

logger = logging.getLogger(__name__)


class PDFExtractor(BaseExtractor):
    """Extract text and images from PDF files"""
    
    SUPPORTED_EXTENSIONS = ['.pdf']
    
    def __init__(self, output_base_path: Path):
        super().__init__(output_base_path)
        self.fitz_available = self._check_fitz()
    
    def _check_fitz(self) -> bool:
        """Check if PyMuPDF (fitz) is available"""
        try:
            import fitz
            return True
        except ImportError:
            logger.warning("PyMuPDF (fitz) not available - PDF extraction disabled")
            return False
    
    def can_extract(self, filepath: Path) -> bool:
        """Check if this extractor can handle the given file"""
        return filepath.suffix.lower() == '.pdf' and self.fitz_available
    
    def extract(self, filepath: Path, output_dir: Path) -> ExtractionResult:
        """
        Extract text and images from PDF file
        
        Args:
            filepath: Path to PDF file
            output_dir: Directory for extracted files
            
        Returns:
            ExtractionResult with extraction details
        """
        result = ExtractionResult(filepath)
        
        if not self.fitz_available:
            result.add_error("PyMuPDF (fitz) not installed - cannot process PDF files")
            return result
        
        try:
            import fitz  # PyMuPDF
            
            logger.info(f"Extracting PDF file: {filepath.name}")
            
            # Ensure output directory exists
            if not self.ensure_output_dir(output_dir):
                result.add_error(f"Failed to create output directory: {output_dir}")
                return result
            
            # Create subdirectory for images
            file_safe_name = self.sanitize_filename(filepath.name)
            images_dir = output_dir / f"{file_safe_name}_images"
            
            # Open PDF
            doc = fitz.open(filepath)
            
            result.metadata['page_count'] = len(doc)
            logger.info(f"PDF has {len(doc)} pages")
            
            # Extract text
            text_output = output_dir / f"{file_safe_name}.txt"
            text_content = self._extract_text(doc, result)
            
            if text_content.strip():
                with open(text_output, 'w', encoding='utf-8') as f:
                    f.write(text_content)
                result.add_file(text_output)
                logger.info(f"Extracted text to {text_output.name}")
            else:
                result.add_warning("No text content found in PDF")
            
            # Extract images
            image_count = self._extract_images(doc, images_dir, result)
            
            if image_count > 0:
                result.metadata['images_extracted'] = image_count
                logger.info(f"Extracted {image_count} images")
            else:
                logger.info("No images found in PDF")
            
            doc.close()
            
            if len(result.extracted_files) > 0:
                result.success = True
                logger.info(f"Successfully extracted data from {filepath.name}")
            else:
                result.add_warning("No data extracted from PDF")
            
        except Exception as e:
            error_msg = f"Failed to extract {filepath.name}: {str(e)}"
            logger.error(error_msg)
            result.add_error(error_msg)
        
        return result
    
    def _extract_text(self, doc, result: ExtractionResult) -> str:
        """Extract all text from PDF document"""
        try:
            import fitz
            
            text_parts = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Add page header
                text_parts.append(f"\n{'='*80}\n")
                text_parts.append(f"Page {page_num + 1}\n")
                text_parts.append(f"{'='*80}\n\n")
                
                # Extract text
                text = page.get_text()
                
                if text.strip():
                    text_parts.append(text)
                else:
                    text_parts.append("[No text on this page]\n")
                
                text_parts.append("\n")
            
            return ''.join(text_parts)
            
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            result.add_warning(f"Text extraction error: {e}")
            return ""
    
    def _extract_images(self, doc, output_dir: Path, result: ExtractionResult) -> int:
        """Extract all images from PDF document"""
        try:
            import fitz
            from PIL import Image
            import io
            
            image_count = 0
            
            # Ensure output directory exists
            if not self.ensure_output_dir(output_dir):
                result.add_warning(f"Failed to create images directory: {output_dir}")
                return 0
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Get list of images on the page
                image_list = page.get_images(full=True)
                
                for img_index, img in enumerate(image_list):
                    try:
                        # Get image XREF (reference)
                        xref = img[0]
                        
                        # Extract image
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        
                        # Create filename
                        image_count += 1
                        img_filename = f"page{page_num + 1}_img{img_index + 1}.{image_ext}"
                        img_path = output_dir / img_filename
                        
                        # Save image
                        with open(img_path, 'wb') as f:
                            f.write(image_bytes)
                        
                        result.add_file(img_path)
                        logger.debug(f"Extracted image: {img_filename}")
                        
                    except Exception as e:
                        logger.warning(f"Failed to extract image {img_index + 1} from page {page_num + 1}: {e}")
            
            return image_count
            
        except Exception as e:
            logger.error(f"Error extracting images: {e}")
            result.add_warning(f"Image extraction error: {e}")
            return 0

