"""
Base extractor class for all document extractors
"""

import os
import logging
from pathlib import Path
from abc import ABC, abstractmethod
from typing import Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class ExtractionInterrupted(Exception):
    """Raised when extraction is interrupted by user (skip/cancel)"""
    pass


class ExtractionResult:
    """Result of an extraction operation"""
    
    def __init__(self, source_file: Path, success: bool = True):
        self.source_file = source_file
        self.success = success
        self.extracted_files: List[Path] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.metadata: Dict = {}
    
    def add_file(self, filepath: Path):
        """Add an extracted file to the result"""
        self.extracted_files.append(filepath)
    
    def add_error(self, error: str):
        """Add an error message"""
        self.errors.append(error)
        self.success = False
    
    def add_warning(self, warning: str):
        """Add a warning message"""
        self.warnings.append(warning)
    
    def __repr__(self):
        status = "SUCCESS" if self.success else "FAILED"
        return f"ExtractionResult({self.source_file.name}, {status}, {len(self.extracted_files)} files)"


class BaseExtractor(ABC):
    """Base class for all document extractors"""
    
    def __init__(self, output_base_path: Path):
        self.output_base_path = Path(output_base_path)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.substep_callback: Optional[Callable[[str], None]] = None
        self._interrupted = False
    
    def set_substep_callback(self, callback: Optional[Callable[[str], None]]):
        """Set callback for reporting sub-step progress"""
        self.substep_callback = callback
    
    def report_substep(self, message: str):
        """Report a sub-step progress update"""
        if self.substep_callback:
            self.substep_callback(message)
    
    def interrupt(self):
        """Signal the extractor to stop processing"""
        self._interrupted = True
    
    def reset_interrupt(self):
        """Reset the interrupt flag before starting a new extraction"""
        self._interrupted = False
    
    def check_interrupted(self):
        """
        Check if extraction was interrupted and raise exception if so.
        Call this in processing loops to allow immediate cancellation.
        """
        if self._interrupted:
            raise ExtractionInterrupted("Extraction interrupted by user")
    
    @abstractmethod
    def can_extract(self, filepath: Path) -> bool:
        """Check if this extractor can handle the given file"""
        pass
    
    @abstractmethod
    def extract(self, filepath: Path, output_dir: Path) -> ExtractionResult:
        """
        Extract data from the file to the output directory
        
        Args:
            filepath: Path to the source file
            output_dir: Directory where extracted files should be placed
            
        Returns:
            ExtractionResult with details of the extraction
        """
        pass
    
    def sanitize_filename(self, name: str, max_length: int = 200) -> str:
        """
        Convert filename to safe directory/file name
        
        Args:
            name: Original filename
            max_length: Maximum length for the sanitized name
            
        Returns:
            Sanitized filename
        """
        # Remove extension
        name = Path(name).stem
        
        # Replace problematic characters
        safe = name.replace(' ', '_').replace('/', '_').replace('\\', '_')
        safe = safe.replace('(', '').replace(')', '').replace('-', '_')
        safe = safe.replace('[', '').replace(']', '').replace('{', '').replace('}', '')
        safe = safe.replace('&', 'and').replace('#', 'num')
        
        # Remove any non-alphanumeric characters except underscore
        safe = ''.join(c for c in safe if c.isalnum() or c == '_')
        
        # Remove consecutive underscores
        while '__' in safe:
            safe = safe.replace('__', '_')
        
        # Trim and lowercase
        safe = safe.strip('_').lower()
        
        # Ensure it's not empty
        if not safe:
            safe = 'unnamed'
        
        # Truncate if too long
        if len(safe) > max_length:
            safe = safe[:max_length]
        
        return safe
    
    def ensure_output_dir(self, output_dir: Path) -> bool:
        """
        Ensure output directory exists
        
        Args:
            output_dir: Directory to create
            
        Returns:
            True if successful, False otherwise
        """
        try:
            output_dir.mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            self.logger.error(f"Failed to create output directory {output_dir}: {e}")
            return False
    
    def get_unique_filename(self, directory: Path, base_name: str, extension: str) -> Path:
        """
        Get a unique filename in the directory by adding numbers if needed
        
        Args:
            directory: Directory where the file will be created
            base_name: Base name for the file
            extension: File extension (with or without dot)
            
        Returns:
            Unique file path
        """
        if not extension.startswith('.'):
            extension = f'.{extension}'
        
        filepath = directory / f"{base_name}{extension}"
        
        if not filepath.exists():
            return filepath
        
        # File exists, add number
        counter = 1
        while True:
            filepath = directory / f"{base_name}_{counter}{extension}"
            if not filepath.exists():
                return filepath
            counter += 1
            
            # Safety check
            if counter > 1000:
                raise ValueError(f"Too many files with similar names: {base_name}")

