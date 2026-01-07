# DocPrep

Document extraction tool with web UI.

## Development Setup

### 1. Create Conda Environment

```bash
conda create -n data-extraction-tool python=3.11
conda activate data-extraction-tool
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd src/gui/web
npm install
cd ../../..
```

## Running the App

### Development Mode (with hot reload)

Terminal 1 - Start Vite dev server:

```bash
cd src/gui/web
npm run dev
```

Terminal 2 - Run Python app in dev mode:

```bash
python src/main.py --dev
```

### Production Mode (with built files)

Build the frontend:

```bash
cd src/gui/web
npm run build
cd ../../..
```

Run the app:

```bash
python src/main.py
```

## Build & Release macOS App

### Prerequisites

- Developer ID Application certificate installed
- Notarization credentials stored: `xcrun notarytool store-credentials "docprep-notarize"`
- `create-dmg` installed: `brew install create-dmg`

### Build, Sign & Notarize

```bash
source /opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh
conda activate docprep
cd build_scripts
./build_signed_mac.sh 1.0.0
```

### Upload to R2

```bash
wrangler r2 object put docprep-releases/releases/docprep-1.0.0.dmg \
  --file dist/docprep-1.0.0.dmg \
  --content-type "application/octet-stream" \
  --remote
```
