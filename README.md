![docprep](assets/HEADER.png)

# Welcome to docprep - [Visit site](https://docprep.site/)

A desktop application that extracts clean text from Microsoft Office documents and PDFs while preserving your file tree structure.

## Purpose

Corporate documents are bloated with formatting, animations, and metadata that make them difficult for AI tools to process. A PowerPoint presentation can exceed 1GB when the actual content is less than 100KB. Docprep solves this by extracting plain text from Office files while mirroring your directory structure, making documents AI-ready and enabling semantic indexing in tools like Cursor.

All processing happens locally on your machine - no data is ever uploaded or sent anywhere.

## Architecture

Docprep is built as a cross-platform desktop application:

- **Backend**: Python with PyWebView
  - Document extraction using specialized libraries for each format (PDF, Excel, Word, PowerPoint)
  - Local file processing - no network requests
  - File tree mirroring to preserve structure

- **Frontend**: React + TypeScript
  - UI built with shadcn components
  - Vite for development and bundling
  - Tailwind CSS for styling

The Python backend handles all document extraction and communicates with the React frontend through PyWebView's JavaScript bridge.

## Tech Stack

**Backend**
- Python 3.11
- PyWebView (desktop wrapper)
- PyMuPDF (PDF extraction)
- python-pptx (PowerPoint)
- python-docx (Word)
- openpyxl (Excel)

**Frontend**
- React 18 + TypeScript
- Vite
- shadcn/ui components
- Tailwind CSS

**Build & Distribution**
- PyInstaller (bundling)
- DMG creation for macOS
- Code signing & notarization
- Inno Setup for Windows

## Status

This project is now obsolete following the release of Claude Cowork in January 2026, which includes native Office document extraction. The repository has been made public as part of my portfolio.

---

For development setup and build instructions, see [docs/development.md](docs/development.md).
