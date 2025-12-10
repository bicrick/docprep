"""
PowerPoint extractor - Extract slide text, notes, and images from .pptx files
"""

import logging
from pathlib import Path
from typing import Optional

from extractors.base import BaseExtractor, ExtractionResult

logger = logging.getLogger(__name__)


class PowerPointExtractor(BaseExtractor):
    """Extract text and images from PowerPoint presentations (.pptx)"""
    
    SUPPORTED_EXTENSIONS = ['.pptx']
    
    def __init__(self, output_base_path: Path, extract_images: bool = False):
        super().__init__(output_base_path)
        self.pptx_available = self._check_pptx()
        self.extract_images = extract_images
    
    def _check_pptx(self) -> bool:
        """Check if python-pptx is available"""
        try:
            import pptx
            return True
        except ImportError:
            logger.warning("python-pptx not available - PowerPoint extraction disabled")
            return False
    
    def can_extract(self, filepath: Path) -> bool:
        """Check if this extractor can handle the given file"""
        return filepath.suffix.lower() == '.pptx' and self.pptx_available
    
    def extract(self, filepath: Path, output_dir: Path) -> ExtractionResult:
        """
        Extract text and images from PowerPoint presentation
        
        Args:
            filepath: Path to PowerPoint file
            output_dir: Directory for extracted files
            
        Returns:
            ExtractionResult with extraction details
        """
        result = ExtractionResult(filepath)
        
        if not self.pptx_available:
            result.add_error("python-pptx not installed - cannot process PowerPoint files")
            return result
        
        try:
            import pptx
            from PIL import Image
            import io
            
            logger.info(f"Extracting PowerPoint file: {filepath.name}")
            
            # Ensure output directory exists
            if not self.ensure_output_dir(output_dir):
                result.add_error(f"Failed to create output directory: {output_dir}")
                return result
            
            # Create subdirectory for images
            file_safe_name = self.sanitize_filename(filepath.name)
            images_dir = output_dir / f"{file_safe_name}_images"
            
            # Open presentation
            prs = pptx.Presentation(filepath)
            
            result.metadata['slide_count'] = len(prs.slides)
            logger.info(f"Presentation has {len(prs.slides)} slides")
            
            # Extract text from all slides
            text_output = output_dir / f"{file_safe_name}.txt"
            text_content = self._extract_text(prs, result)
            
            if text_content.strip():
                with open(text_output, 'w', encoding='utf-8') as f:
                    f.write(text_content)
                result.add_file(text_output)
                logger.info(f"Extracted text to {text_output.name}")
            else:
                result.add_warning("No text content found in presentation")
            
            # Extract images and charts (only if enabled)
            if self.extract_images:
                image_count = self._extract_images(prs, images_dir, result)
                
                if image_count > 0:
                    result.metadata['images_extracted'] = image_count
                    logger.info(f"Extracted {image_count} images/charts")
                else:
                    logger.info("No images found in presentation")
            else:
                logger.info("Image extraction disabled for PowerPoint")
            
            if len(result.extracted_files) > 0:
                result.success = True
                logger.info(f"Successfully extracted data from {filepath.name}")
            else:
                result.add_warning("No data extracted from PowerPoint")
            
        except Exception as e:
            error_msg = f"Failed to extract {filepath.name}: {str(e)}"
            logger.error(error_msg)
            result.add_error(error_msg)
        
        return result
    
    def _extract_text(self, prs, result: ExtractionResult) -> str:
        """Extract all text from PowerPoint presentation"""
        try:
            text_parts = []
            
            text_parts.append(f"PowerPoint Presentation\n")
            text_parts.append(f"Total Slides: {len(prs.slides)}\n")
            text_parts.append(f"{'='*80}\n\n")
            
            for slide_idx, slide in enumerate(prs.slides, 1):
                text_parts.append(f"\n{'='*80}\n")
                text_parts.append(f"SLIDE {slide_idx}\n")
                text_parts.append(f"{'='*80}\n\n")
                
                # Extract text from shapes
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text.strip():
                        text_parts.append(f"{shape.text}\n")
                
                # Extract notes
                if slide.has_notes_slide:
                    notes_slide = slide.notes_slide
                    if hasattr(notes_slide, 'notes_text_frame'):
                        notes_text = notes_slide.notes_text_frame.text.strip()
                        if notes_text:
                            text_parts.append(f"\n--- NOTES ---\n")
                            text_parts.append(f"{notes_text}\n")
                
                text_parts.append("\n")
            
            return ''.join(text_parts)
            
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            result.add_warning(f"Text extraction error: {e}")
            return ""
    
    def _extract_images(self, prs, output_dir: Path, result: ExtractionResult) -> int:
        """Extract all images and charts from PowerPoint presentation"""
        try:
            from PIL import Image
            import io
            
            image_count = 0
            
            for slide_idx, slide in enumerate(prs.slides, 1):
                for shape_idx, shape in enumerate(slide.shapes, 1):
                    try:
                        # Check if shape is a picture
                        if hasattr(shape, "image"):
                            # Ensure output directory exists
                            if not self.ensure_output_dir(output_dir):
                                result.add_warning(f"Failed to create images directory: {output_dir}")
                                continue
                            
                            # Get image data
                            image = shape.image
                            image_bytes = image.blob
                            
                            # Determine extension
                            ext = image.ext
                            if not ext:
                                ext = 'png'
                            
                            # Create filename
                            image_count += 1
                            img_filename = f"slide{slide_idx}_shape{shape_idx}.{ext}"
                            img_path = output_dir / img_filename
                            
                            # Save image
                            with open(img_path, 'wb') as f:
                                f.write(image_bytes)
                            
                            result.add_file(img_path)
                            logger.debug(f"Extracted image from slide {slide_idx}: {img_filename}")
                        
                        # Check if shape contains a chart
                        elif hasattr(shape, "chart"):
                            # Charts are complex objects - we can extract their data
                            # but rendering them is more complex
                            logger.debug(f"Found chart in slide {slide_idx}, shape {shape_idx}")
                            result.metadata.setdefault('charts_found', 0)
                            result.metadata['charts_found'] += 1
                        
                    except Exception as e:
                        logger.warning(f"Failed to extract image/chart from slide {slide_idx}, shape {shape_idx}: {e}")
            
            return image_count
            
        except Exception as e:
            logger.error(f"Error extracting images: {e}")
            result.add_warning(f"Image extraction error: {e}")
            return 0

