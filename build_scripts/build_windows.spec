# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Windows build
Build with: pyinstaller build_windows.spec

Prerequisites:
  1. Run: python build_icons.py (to generate icons/docprep.ico)
  2. Run: pip install pyinstaller

Note: LibreOffice is an optional system dependency for PowerPoint slide image extraction.
      Users can install it separately from https://www.libreoffice.org if needed.
"""

import sys
import os
from pathlib import Path

block_cipher = None

datas = [
    # Web assets for pywebview UI
    ('src/gui/web', 'gui/web'),
]

a = Analysis(
    ['src/main.py'],
    pathex=['src'],  # Include src directory for local module imports
    binaries=[],
    datas=datas,
    hiddenimports=[
        # Local modules from src/
        'config',
        'gui',
        'gui.webview_app',
        'gui.web',
        'utils',
        'utils.file_scanner',
        'utils.report',
        'utils.office_converter',
        'extractors',
        'extractors.base',
        'extractors.excel',
        'extractors.pdf',
        'extractors.word',
        'extractors.powerpoint',
        
        # PyWebview and its Windows backend
        'webview',
        'webview.platforms',
        'webview.platforms.winforms',
        
        # Pandas dependencies
        'pandas',
        'pandas._libs',
        'pandas._libs.tslibs',
        'pandas._libs.tslibs.timedeltas',
        'pandas._libs.tslibs.np_datetime',
        'pandas._libs.tslibs.nattype',
        'pandas._libs.tslibs.timestamps',
        'pandas.io.formats.style',
        'numpy',
        'numpy.core',
        'numpy.core._multiarray_umath',
        'pytz',
        'dateutil',
        'dateutil.parser',
        
        # Excel processing
        'openpyxl',
        'openpyxl.cell',
        'openpyxl.cell._writer',
        'openpyxl.styles',
        'openpyxl.styles.stylesheet',
        'openpyxl.chart',
        'openpyxl.chart._chart',
        'openpyxl.drawing',
        'openpyxl.drawing.image',
        'et_xmlfile',
        'xlrd',
        'xlrd.xlsx',
        
        # PDF processing
        'fitz',
        'pymupdf',
        
        # Word processing
        'docx',
        'docx.oxml',
        'docx.oxml.xmlchemy',
        'docx.parts',
        'docx.text',
        'lxml',
        'lxml.etree',
        'lxml._elementpath',
        
        # PowerPoint processing
        'pptx',
        'pptx.oxml',
        'pptx.oxml.xmlchemy',
        'pptx.util',
        'pptx.chart',
        'pptx.chart.data',
        
        # Image processing
        'PIL',
        'PIL.Image',
        'PIL._imaging',
        'PIL.ImageDraw',
        'PIL.ImageFont',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='DocPrep',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # No console window (GUI app)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icons/docprep.ico',  # Windows icon
)
