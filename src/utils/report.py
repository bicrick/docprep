"""
Report generation utilities
"""

import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate summary reports for extraction operations"""
    
    @staticmethod
    def generate_summary_report(output_dir: Path, 
                               scan_results: Dict,
                               extraction_summary: Dict,
                               extraction_results: List) -> Path:
        """
        Generate a comprehensive summary report
        
        Args:
            output_dir: Base output directory
            scan_results: Results from file scanning
            extraction_summary: Summary of extraction operation
            extraction_results: List of individual extraction results
            
        Returns:
            Path to generated report file
        """
        report_path = output_dir / "EXTRACTION_REPORT.txt"
        
        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                # Header
                f.write("="*80 + "\n")
                f.write("DATA EXTRACTION REPORT\n")
                f.write("="*80 + "\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Output Directory: {output_dir}\n")
                f.write("="*80 + "\n\n")
                
                # Scan Summary
                f.write("SCAN SUMMARY\n")
                f.write("-"*80 + "\n")
                f.write(f"Files scanned: {scan_results.get('supported_count', 0)}\n")
                f.write(f"Total size: {ReportGenerator._format_size(scan_results.get('total_size', 0))}\n")
                f.write("\nFile types found:\n")
                for ext, count in scan_results.get('file_types', {}).items():
                    f.write(f"  {ext}: {count} files\n")
                f.write("\n")
                
                # Extraction Summary
                f.write("EXTRACTION SUMMARY\n")
                f.write("-"*80 + "\n")
                f.write(f"Files processed: {extraction_summary.get('total_processed', 0)}\n")
                f.write(f"Successful: {extraction_summary.get('successful', 0)}\n")
                f.write(f"Failed: {extraction_summary.get('failed', 0)}\n")
                f.write(f"Warnings: {extraction_summary.get('warnings', 0)}\n")
                f.write(f"Total files extracted: {extraction_summary.get('total_files_extracted', 0)}\n")
                
                if extraction_summary.get('cancelled'):
                    f.write("\n⚠ EXTRACTION WAS CANCELLED BY USER\n")
                
                f.write("\n")
                
                # Detailed Results
                if extraction_results:
                    f.write("DETAILED RESULTS\n")
                    f.write("-"*80 + "\n\n")
                    
                    # Group by status
                    successful = [r for r in extraction_results if r.success]
                    failed = [r for r in extraction_results if not r.success]
                    
                    # Successful extractions
                    if successful:
                        f.write(f"SUCCESSFUL EXTRACTIONS ({len(successful)})\n")
                        f.write("-"*80 + "\n")
                        for result in successful:
                            f.write(f"\n✓ {result.source_file.name}\n")
                            f.write(f"  Files extracted: {len(result.extracted_files)}\n")
                            
                            if result.metadata:
                                f.write("  Metadata:\n")
                                for key, value in result.metadata.items():
                                    f.write(f"    {key}: {value}\n")
                            
                            if result.warnings:
                                f.write("  Warnings:\n")
                                for warning in result.warnings:
                                    f.write(f"    - {warning}\n")
                        f.write("\n")
                    
                    # Failed extractions
                    if failed:
                        f.write(f"\nFAILED EXTRACTIONS ({len(failed)})\n")
                        f.write("-"*80 + "\n")
                        for result in failed:
                            f.write(f"\n✗ {result.source_file.name}\n")
                            if result.errors:
                                f.write("  Errors:\n")
                                for error in result.errors:
                                    f.write(f"    - {error}\n")
                        f.write("\n")
                
                # Footer
                f.write("="*80 + "\n")
                f.write("END OF REPORT\n")
                f.write("="*80 + "\n")
            
            logger.info(f"Report generated: {report_path}")
            return report_path
            
        except Exception as e:
            logger.error(f"Failed to generate report: {e}")
            raise
    
    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """Format byte size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"

