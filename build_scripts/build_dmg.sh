#!/bin/bash
#
# Build signed and notarized DMG installer for docprep
#
# Prerequisites:
#   1. Install create-dmg: brew install create-dmg
#   2. Build the app first: pyinstaller --clean -y build_mac.spec
#   3. Generate background: python generate_dmg_background.py
#   4. Apple Developer ID certificate installed in Keychain
#   5. Notarization credentials stored: xcrun notarytool store-credentials "DocprepNotary"
#
# Usage: ./build_dmg.sh [version]
#   Example: ./build_dmg.sh 1.0.0

set -e

# Configuration
APP_NAME="docprep"
VERSION="${1:-1.0.0}"
DMG_NAME="${APP_NAME}-${VERSION}.dmg"
VOLUME_NAME="${APP_NAME}"

# Signing configuration
DEVELOPER_ID="Developer ID Application: Patrick Brown (3BUPEZ2FJQ)"
NOTARY_PROFILE="DocprepNotary"
ENTITLEMENTS="entitlements.plist"

# Paths (relative to build_scripts directory)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="${SCRIPT_DIR}/dist"
APP_PATH="${DIST_DIR}/${APP_NAME}.app"
DMG_OUTPUT="${DIST_DIR}/${DMG_NAME}"
BACKGROUND_IMAGE="${SCRIPT_DIR}/dmg_background.png"

echo "============================================"
echo "Building Signed DMG: ${DMG_NAME}"
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

if [ ! -f "${SCRIPT_DIR}/${ENTITLEMENTS}" ]; then
    echo "Error: Entitlements file not found at ${SCRIPT_DIR}/${ENTITLEMENTS}"
    exit 1
fi

# Always (re)generate background so visual tweaks are reflected immediately
echo "Generating DMG background..."
cd "$SCRIPT_DIR"
python generate_dmg_background.py --output "$BACKGROUND_IMAGE" --width 660 --height 400

# Remove old DMG if exists
if [ -f "$DMG_OUTPUT" ]; then
    echo "Removing old DMG..."
    rm "$DMG_OUTPUT"
fi

echo ""
echo "============================================"
echo "Step 1: Code Signing Application"
echo "============================================"

# Sign all nested components first (frameworks, dylibs, etc.)
echo "Signing nested components..."
find "${APP_PATH}/Contents" -type f \( -name "*.dylib" -o -name "*.so" -o -name "*.framework" \) -exec \
    codesign --force --verbose --timestamp --options runtime \
    --entitlements "${SCRIPT_DIR}/${ENTITLEMENTS}" \
    --sign "${DEVELOPER_ID}" {} \; 2>/dev/null || true

# Sign executables in MacOS folder
echo "Signing executables..."
find "${APP_PATH}/Contents/MacOS" -type f -perm +111 -exec \
    codesign --force --verbose --timestamp --options runtime \
    --entitlements "${SCRIPT_DIR}/${ENTITLEMENTS}" \
    --sign "${DEVELOPER_ID}" {} \; 2>/dev/null || true

# Sign the main app bundle
echo "Signing main application bundle..."
codesign --force --deep --verbose --timestamp --options runtime \
    --entitlements "${SCRIPT_DIR}/${ENTITLEMENTS}" \
    --sign "${DEVELOPER_ID}" \
    "${APP_PATH}"

# Verify signature
echo ""
echo "Verifying code signature..."
codesign --verify --verbose "${APP_PATH}"
echo "Code signature verified successfully!"

echo ""
echo "============================================"
echo "Step 2: Notarizing Application"
echo "============================================"

# Create a zip for notarization
echo "Creating zip for notarization..."
ZIP_PATH="${DIST_DIR}/${APP_NAME}-notarize.zip"
ditto -c -k --rsrc --sequesterRsrc --keepParent "${APP_PATH}" "${ZIP_PATH}"

# Submit for notarization
echo "Submitting to Apple for notarization (this may take a few minutes)..."
xcrun notarytool submit "${ZIP_PATH}" \
    --keychain-profile "${NOTARY_PROFILE}" \
    --wait

# Staple the notarization ticket to the app
echo ""
echo "Stapling notarization ticket to app..."
xcrun stapler staple "${APP_PATH}"

# Verify stapling
echo "Verifying stapled ticket..."
xcrun stapler validate "${APP_PATH}"

# Clean up zip
rm "${ZIP_PATH}"

echo ""
echo "============================================"
echo "Step 3: Creating DMG"
echo "============================================"

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
echo "Step 4: Signing DMG"
echo "============================================"

# Sign the DMG
echo "Signing DMG..."
codesign --force --verbose --timestamp --options runtime \
    --sign "${DEVELOPER_ID}" \
    "${DMG_OUTPUT}"

# Verify DMG signature
echo "Verifying DMG signature..."
codesign --verify --verbose "${DMG_OUTPUT}"

echo ""
echo "============================================"
echo "Step 5: Notarizing DMG"
echo "============================================"

# Submit DMG for notarization
echo "Submitting DMG to Apple for notarization..."
xcrun notarytool submit "${DMG_OUTPUT}" \
    --keychain-profile "${NOTARY_PROFILE}" \
    --wait

# Staple ticket to DMG
echo "Stapling notarization ticket to DMG..."
xcrun stapler staple "${DMG_OUTPUT}"

# Verify DMG stapling
echo "Verifying DMG stapled ticket..."
xcrun stapler validate "${DMG_OUTPUT}"

echo ""
echo "============================================"
echo "Step 6: Final Verification"
echo "============================================"

# Final Gatekeeper check
echo "Running Gatekeeper assessment..."
spctl --assess --type open --context context:primary-signature -vvv "${DMG_OUTPUT}" 2>&1 || true

echo ""
echo "============================================"
echo "BUILD COMPLETE!"
echo "============================================"
echo ""
echo "Output: ${DMG_OUTPUT}"
echo ""
ls -lh "$DMG_OUTPUT"
echo ""
echo "The DMG is signed and notarized, ready for distribution!"
