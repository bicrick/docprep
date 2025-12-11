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
