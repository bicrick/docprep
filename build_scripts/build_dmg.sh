#!/bin/bash
#
# Build DMG installer for docprep
#
# Prerequisites:
#   1. Install create-dmg: brew install create-dmg
#   2. Build the app first: pyinstaller --clean -y build_mac.spec
#   3. Generate background: python generate_dmg_background.py
#
# Usage: ./build_dmg.sh [version]
#   Example: ./build_dmg.sh 1.0.0

set -e

# Configuration
APP_NAME="docprep"
VERSION="${1:-1.0.0}"
DMG_NAME="${APP_NAME}-${VERSION}.dmg"
VOLUME_NAME="${APP_NAME}"

# Paths (relative to build_scripts directory)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${SCRIPT_DIR}/dist"
APP_PATH="${DIST_DIR}/${APP_NAME}.app"
DMG_OUTPUT="${DIST_DIR}/${DMG_NAME}"
BACKGROUND_IMAGE="${SCRIPT_DIR}/dmg_background.png"

echo "============================================"
echo "Building DMG: ${DMG_NAME}"
echo "============================================"

# Check prerequisites
if ! command -v create-dmg &> /dev/null; then
    echo "Error: create-dmg is not installed"
    echo "Install with: brew install create-dmg"
    exit 1
fi

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App not found at ${APP_PATH}"
    echo "Build the app first: pyinstaller --clean -y build_mac.spec"
    exit 1
fi

# Generate background if it doesn't exist
if [ ! -f "$BACKGROUND_IMAGE" ]; then
    echo "Generating DMG background..."
    cd "$SCRIPT_DIR"
    python generate_dmg_background.py
fi

# Remove old DMG if exists
if [ -f "$DMG_OUTPUT" ]; then
    echo "Removing old DMG..."
    rm "$DMG_OUTPUT"
fi

# Create DMG
echo "Creating DMG..."
create-dmg \
    --volname "${VOLUME_NAME}" \
    --volicon "${SCRIPT_DIR}/icons/mac/AppIcon.icns" \
    --window-pos 200 120 \
    --window-size 660 400 \
    --icon-size 100 \
    --icon "${APP_NAME}.app" 180 200 \
    --hide-extension "${APP_NAME}.app" \
    --app-drop-link 480 200 \
    --background "${BACKGROUND_IMAGE}" \
    "${DMG_OUTPUT}" \
    "${APP_PATH}"

echo ""
echo "============================================"
echo "DMG created successfully!"
echo "Output: ${DMG_OUTPUT}"
echo "============================================"

# Show file size
ls -lh "$DMG_OUTPUT"




