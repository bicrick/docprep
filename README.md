# DocPrep

Extract your business documents as plain text for use in Cursor.

## Supported Formats

- PDF (.pdf)
- Excel (.xlsx, .xls)
- Word (.docx)
- PowerPoint (.pptx)

## Installation

```bash
conda create -n data-extraction-tool python=3.11
conda activate data-extraction-tool
pip install -r requirements.txt
```

## Usage

```bash
python src/main.py
```

1. Click **Get Started**
2. Drop a folder or click to browse
3. Click **Start Extraction**
4. Open the output folder when complete

## Output

The tool creates a mirrored folder structure with extracted content:

```
YourFolder_extracted/
  document.csv        # Excel sheets as CSV
  report.txt          # PDF/Word text content
  presentation.txt    # PowerPoint slides
  images/             # Embedded images
```

## Building Standalone Executables

The app can be built as a standalone executable that runs without Python installed.

### Prerequisites

```bash
pip install pyinstaller
```

### 1. Generate Icons

First, generate the app icons from the source PNG:

```bash
python build_icons.py
```

This creates:
- `icons/docprep.icns` (Mac)
- `icons/docprep.ico` (Windows)

### 2. Build for Mac

Run on a Mac:

```bash
pyinstaller build_mac.spec
```

Output: `dist/DocPrep.app` - Double-click to run, or drag to Applications folder.

### 3. Build for Windows

Run on Windows:

```bash
pyinstaller build_windows.spec
```

Output: `dist/DocPrep.exe` - Double-click to run.

### Notes

- You must build on each target platform (cannot cross-compile)
- The executable bundles Python and all dependencies (~100-200MB)
- Users do not need Python installed to run the app
