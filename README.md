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

## Building

```bash
pyinstaller build_mac.spec    # Mac
pyinstaller build_windows.spec # Windows
```
