"""
File scanner utility - Recursively scan directories and manage file extraction
"""

import logging
from pathlib import Path
from typing import List, Dict, Callable, Optional
import os

from config import is_supported_file, get_all_supported_extensions
from extractors.base import ExtractionInterrupted

logger = logging.getLogger(__name__)


class FileScanner:
    """Recursively scan directories and identify files for extraction"""
    
    def __init__(self, root_path: Path):
        self.root_path = Path(root_path)
        self.supported_files: List[Path] = []
        self.unsupported_files: List[Path] = []
        self.total_size: int = 0
    
    def scan(self, progress_callback: Optional[Callable] = None) -> Dict:
        """
        Scan directory tree and identify all supported files
        
        Args:
            progress_callback: Optional callback function for progress updates
            
        Returns:
            Dictionary with scan results
        """
        logger.info(f"Scanning directory: {self.root_path}")
        
        if not self.root_path.exists():
            raise ValueError(f"Directory does not exist: {self.root_path}")
        
        if not self.root_path.is_dir():
            raise ValueError(f"Not a directory: {self.root_path}")
        
        self.supported_files = []
        self.unsupported_files = []
        self.total_size = 0
        
        # Walk through directory tree
        for root, dirs, files in os.walk(self.root_path):
            root_path = Path(root)
            
            # Skip hidden directories and common ignore patterns
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'node_modules']]
            
            for filename in files:
                # Skip hidden files
                if filename.startswith('.'):
                    continue
                
                filepath = root_path / filename
                
                # Check if file is supported
                if is_supported_file(filepath):
                    self.supported_files.append(filepath)
                    try:
                        self.total_size += filepath.stat().st_size
                    except:
                        pass
                else:
                    self.unsupported_files.append(filepath)
                
                # Call progress callback if provided
                if progress_callback:
                    progress_callback(filepath)
        
        results = {
            'supported_count': len(self.supported_files),
            'unsupported_count': len(self.unsupported_files),
            'total_size': self.total_size,
            'supported_files': self.supported_files,
            'file_types': self._count_file_types()
        }
        
        logger.info(f"Scan complete: {results['supported_count']} supported files found")
        
        return results
    
    def _count_file_types(self) -> Dict[str, int]:
        """Count files by extension"""
        counts = {}
        for filepath in self.supported_files:
            ext = filepath.suffix.lower()
            counts[ext] = counts.get(ext, 0) + 1
        return counts
    
    def get_relative_path(self, filepath: Path) -> Path:
        """Get relative path from root directory"""
        try:
            return filepath.relative_to(self.root_path)
        except ValueError:
            return filepath
    
    def create_mirrored_output_path(self, filepath: Path, output_base: Path) -> Path:
        """
        Create mirrored output path maintaining directory structure
        
        Args:
            filepath: Original file path
            output_base: Base output directory
            
        Returns:
            Output directory path for this file
        """
        # Get relative path from root
        rel_path = self.get_relative_path(filepath)
        
        # Create mirrored path (excluding the filename)
        mirrored_dir = output_base / rel_path.parent
        
        return mirrored_dir


class ExtractionManager:
    """Manage the extraction process for multiple files"""
    
    def __init__(self, scanner: FileScanner, extractors: List):
        self.scanner = scanner
        self.extractors = extractors
        self.results = []
        self.current_file = None
        self.current_extractor = None
        self.cancelled = False
        self.skipped = False
    
    def extract_all(self, 
                   output_base: Path,
                   progress_callback: Optional[Callable] = None,
                   file_callback: Optional[Callable] = None,
                   substep_callback: Optional[Callable] = None) -> Dict:
        """
        Extract all scanned files
        
        Args:
            output_base: Base directory for output
            progress_callback: Callback for overall progress (current, total)
            file_callback: Callback when starting a new file
            substep_callback: Callback for sub-step progress within a file
            
        Returns:
            Summary dictionary of extraction results
        """
        logger.info(f"Starting extraction of {len(self.scanner.supported_files)} files")
        
        output_base = Path(output_base)
        output_base.mkdir(parents=True, exist_ok=True)
        
        successful = 0
        failed = 0
        warnings = 0
        total_files_extracted = 0
        
        total = len(self.scanner.supported_files)
        
        for idx, filepath in enumerate(self.scanner.supported_files, 1):
            # Check if cancelled
            if self.cancelled:
                logger.info("Extraction cancelled by user")
                break
            
            self.current_file = filepath
            
            # Call file callback
            if file_callback:
                file_callback(filepath, idx, total)
            
            # Find appropriate extractor
            extractor = self._find_extractor(filepath)
            
            if not extractor:
                logger.warning(f"No extractor found for {filepath}")
                failed += 1
                continue
            
            # Track current extractor so we can interrupt it
            self.current_extractor = extractor
            
            # Reset interrupt flag before starting
            extractor.reset_interrupt()
            
            # Set substep callback on extractor
            if substep_callback:
                extractor.set_substep_callback(substep_callback)
            
            # Get output directory
            output_dir = self.scanner.create_mirrored_output_path(filepath, output_base)
            
            try:
                # Extract file
                result = extractor.extract(filepath, output_dir)
                self.results.append(result)
                
                if result.success:
                    successful += 1
                    total_files_extracted += len(result.extracted_files)
                else:
                    failed += 1
                
                if result.warnings:
                    warnings += 1
                
            except ExtractionInterrupted:
                # File extraction was interrupted mid-process
                logger.info(f"Extraction interrupted for {filepath}")
                # Don't count as failed - it was user-initiated
                break
                
            except Exception as e:
                logger.error(f"Unexpected error extracting {filepath}: {e}")
                failed += 1
            
            finally:
                self.current_extractor = None
            
            # Call progress callback
            if progress_callback:
                progress_callback(idx, total)
        
        summary = {
            'total_processed': len(self.scanner.supported_files),
            'successful': successful,
            'failed': failed,
            'warnings': warnings,
            'total_files_extracted': total_files_extracted,
            'cancelled': self.cancelled,
            'skipped': self.skipped,
            'processed_count': successful + failed  # Actual number of files processed
        }
        
        logger.info(f"Extraction complete: {successful} successful, {failed} failed")
        
        return summary
    
    def _find_extractor(self, filepath: Path):
        """Find appropriate extractor for file"""
        for extractor in self.extractors:
            if extractor.can_extract(filepath):
                return extractor
        return None
    
    def cancel(self):
        """Cancel the extraction process"""
        self.cancelled = True
        # Interrupt current extractor if one is running
        if self.current_extractor:
            self.current_extractor.interrupt()
        logger.info("Cancellation requested")
    
    def skip(self):
        """Skip remaining files and show summary with current progress"""
        self.cancelled = True
        self.skipped = True
        # Interrupt current extractor if one is running
        if self.current_extractor:
            self.current_extractor.interrupt()
        logger.info("Skip requested - will show summary with current progress")

