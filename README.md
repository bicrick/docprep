# Data Extraction Tool

A cross-platform desktop application for extracting data from various document formats into readable formats.

## Features

- **Excel Files**: Extract sheets to CSV and embedded charts to PNG
- **PDF Files**: Extract text and embedded images
- **Word Documents**: Extract text and embedded images
- **PowerPoint**: Extract slide text, notes, and charts
- **Drag-and-Drop Interface**: Simple, user-friendly GUI
- **Folder Mirroring**: Maintains original folder structure in output

## Supported File Types

- Excel: `.xlsx`, `.xls`
- PDF: `.pdf`
- Word: `.docx`
- PowerPoint: `.pptx`

## Installation

### For Development

1. Install Python 3.8 or higher
2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python src/main.py
```

### For End Users

Download the appropriate installer for your platform:
- **Mac**: `DataExtractor.app`
- **Windows**: `DataExtractor.exe`

## Building Executables

### Mac
```bash
pyinstaller build_mac.spec
```

### Windows
```bash
pyinstaller build_windows.spec
```

## Usage

1. Launch the application
2. Drag and drop a folder onto the window (or click Browse)
3. Select output location (optional)
4. Click "Start Extraction"
5. Wait for completion and review the summary

## Output Structure

The tool creates a mirrored folder structure with extracted data:

```
Input_Folder/
  Subfolder/
    document.xlsx
    report.pdf

Output_Folder_extracted/
  Subfolder/
    document/
      sheet1.csv
      sheet2.csv
      chart1.png
    report.txt
    report_images/
      image1.png
```

## Development

- `src/main.py` - Application entry point
- `src/gui/` - GUI components
- `src/extractors/` - Document extraction modules
- `src/utils/` - Utility functions

## License

Proprietary - For internal use only
