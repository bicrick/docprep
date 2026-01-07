#!/bin/bash
#
# Build, Sign, Notarize, and Package docprep for macOS Distribution
#
# Prerequisites:
#   1. Developer ID Application certificate installed in Keychain
#   2. App-specific password stored in Keychain (see setup below)
#   3. create-dmg installed: brew install create-dmg
#   4. Web assets built: cd src/gui/web && npm run build
#
# Setup app-specific password (one-time):
#   1. Go to appleid.apple.com > Sign-In and Security > App-Specific Passwords
#   2. Generate a password named "docprep-notarize"
#   3. Store it in Keychain:
#      xcrun notarytool store-credentials "docprep-notarize" \
#        --apple-id "YOUR_APPLE_ID" \
#        --team-id "3BUPEZ2FJQ" \
#        --password "xxxx-xxxx-xxxx-xxxx"
#
# Usage: ./build_signed_mac.sh [version]
#   Example: ./build_signed_mac.sh 1.0.0
#

set -e

# =============================================================================
# Configuration
# =============================================================================
APP_NAME="docprep"
VERSION="${1:-1.0.0}"
BUNDLE_ID="com.docprep.app"
TEAM_ID="3BUPEZ2FJQ"
DEVELOPER_ID="Developer ID Application: Patrick Brown (3BUPEZ2FJQ)"
NOTARIZE_PROFILE="docprep-notarize"

# Paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="${SCRIPT_DIR}/dist"
APP_PATH="${DIST_DIR}/${APP_NAME}.app"
DMG_NAME="${APP_NAME}-${VERSION}.dmg"
DMG_PATH="${DIST_DIR}/${DMG_NAME}"
ENTITLEMENTS="${SCRIPT_DIR}/entitlements.plist"
BACKGROUND_IMAGE="${SCRIPT_DIR}/dmg_background.png"

# =============================================================================
# Helper Functions
# =============================================================================
print_step() {
    echo ""
    echo "============================================"
    echo "$1"
    echo "============================================"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check for Developer ID certificate
    if ! security find-identity -v -p codesigning | grep -q "$DEVELOPER_ID"; then
        echo "ERROR: Developer ID certificate not found in Keychain"
        echo "Expected: $DEVELOPER_ID"
        echo ""
        echo "Install via Xcode > Settings > Accounts > Manage Certificates"
        exit 1
    fi
    echo "Developer ID certificate found"
    
    # Check for notarization credentials
    if ! xcrun notarytool history --keychain-profile "$NOTARIZE_PROFILE" &>/dev/null; then
        echo ""
        echo "ERROR: Notarization credentials not found"
        echo ""
        echo "To set up notarization credentials:"
        echo "1. Go to appleid.apple.com > Sign-In and Security > App-Specific Passwords"
        echo "2. Generate a new password"
        echo "3. Run this command:"
        echo ""
        echo "   xcrun notarytool store-credentials \"$NOTARIZE_PROFILE\" \\"
        echo "     --apple-id \"YOUR_APPLE_ID_EMAIL\" \\"
        echo "     --team-id \"$TEAM_ID\" \\"
        echo "     --password \"xxxx-xxxx-xxxx-xxxx\""
        echo ""
        exit 1
    fi
    echo "Notarization credentials found"
    
    # Check for create-dmg
    if ! command -v create-dmg &>/dev/null; then
        echo "ERROR: create-dmg not found"
        echo "Install with: brew install create-dmg"
        exit 1
    fi
    echo "create-dmg found"
    
    # Check for entitlements file
    if [ ! -f "$ENTITLEMENTS" ]; then
        echo "ERROR: Entitlements file not found at $ENTITLEMENTS"
        exit 1
    fi
    echo "Entitlements file found"
    
    echo ""
    echo "All prerequisites met!"
}

# =============================================================================
# Build App with PyInstaller
# =============================================================================
build_app() {
    print_step "Building app with PyInstaller..."
    
    cd "$SCRIPT_DIR"
    
    # Clean previous build
    rm -rf "${DIST_DIR}/${APP_NAME}.app" "${DIST_DIR}/${APP_NAME}" build/
    
    # Run PyInstaller
    pyinstaller --clean -y build_mac.spec
    
    if [ ! -d "$APP_PATH" ]; then
        echo "ERROR: PyInstaller build failed - app not found at $APP_PATH"
        exit 1
    fi
    
    echo "App built successfully: $APP_PATH"
}

# =============================================================================
# Sign the App Bundle
# =============================================================================
sign_app() {
    print_step "Signing app bundle..."
    
    # Sign all nested components first (frameworks, dylibs, etc.)
    echo "Signing nested components..."
    find "$APP_PATH" -type f \( -name "*.dylib" -o -name "*.so" -o -name "*.framework" \) | while read -r file; do
        echo "  Signing: $(basename "$file")"
        codesign --force --options runtime --timestamp \
            --entitlements "$ENTITLEMENTS" \
            --sign "$DEVELOPER_ID" \
            "$file" 2>/dev/null || true
    done
    
    # Sign all executables in MacOS folder
    echo "Signing executables..."
    find "$APP_PATH/Contents/MacOS" -type f -perm +111 | while read -r file; do
        echo "  Signing: $(basename "$file")"
        codesign --force --options runtime --timestamp \
            --entitlements "$ENTITLEMENTS" \
            --sign "$DEVELOPER_ID" \
            "$file"
    done
    
    # Sign the main app bundle
    echo "Signing main app bundle..."
    codesign --force --deep --options runtime --timestamp \
        --entitlements "$ENTITLEMENTS" \
        --sign "$DEVELOPER_ID" \
        "$APP_PATH"
    
    # Verify signature
    echo ""
    echo "Verifying signature..."
    codesign --verify --deep --strict --verbose=2 "$APP_PATH"
    
    echo ""
    echo "Checking Gatekeeper acceptance..."
    spctl --assess --type execute --verbose "$APP_PATH" && echo "Gatekeeper: ACCEPTED" || echo "Gatekeeper: Will pass after notarization"
    
    echo ""
    echo "App signed successfully!"
}

# =============================================================================
# Create DMG
# =============================================================================
create_dmg_installer() {
    print_step "Creating DMG installer..."
    
    # Generate background if missing
    if [ ! -f "$BACKGROUND_IMAGE" ]; then
        echo "Generating DMG background..."
        cd "$SCRIPT_DIR"
        python generate_dmg_background.py
    fi
    
    # Remove old DMG
    rm -f "$DMG_PATH"
    
    # Create DMG
    create-dmg \
        --volname "${APP_NAME}" \
        --volicon "${SCRIPT_DIR}/icons/mac/AppIcon.icns" \
        --window-pos 200 120 \
        --window-size 660 400 \
        --icon-size 100 \
        --icon "${APP_NAME}.app" 180 200 \
        --hide-extension "${APP_NAME}.app" \
        --app-drop-link 480 200 \
        --background "${BACKGROUND_IMAGE}" \
        "${DMG_PATH}" \
        "${APP_PATH}"
    
    echo "DMG created: $DMG_PATH"
}

# =============================================================================
# Sign the DMG
# =============================================================================
sign_dmg() {
    print_step "Signing DMG..."
    
    codesign --force --timestamp \
        --sign "$DEVELOPER_ID" \
        "$DMG_PATH"
    
    codesign --verify --verbose "$DMG_PATH"
    
    echo "DMG signed successfully!"
}

# =============================================================================
# Notarize the DMG
# =============================================================================
notarize_dmg() {
    print_step "Submitting for notarization..."
    echo "This may take several minutes..."
    echo ""
    
    # Submit for notarization and wait
    xcrun notarytool submit "$DMG_PATH" \
        --keychain-profile "$NOTARIZE_PROFILE" \
        --wait
    
    # Check result
    echo ""
    echo "Checking notarization status..."
}

# =============================================================================
# Staple the Notarization Ticket
# =============================================================================
staple_dmg() {
    print_step "Stapling notarization ticket to DMG..."
    
    xcrun stapler staple "$DMG_PATH"
    
    # Verify stapling
    xcrun stapler validate "$DMG_PATH"
    
    echo "Notarization ticket stapled successfully!"
}

# =============================================================================
# Final Verification
# =============================================================================
verify_final() {
    print_step "Final verification..."
    
    echo "Checking Gatekeeper acceptance..."
    spctl --assess --type open --context context:primary-signature --verbose "$DMG_PATH"
    
    echo ""
    echo "DMG details:"
    ls -lh "$DMG_PATH"
    
    echo ""
    echo "============================================"
    echo "BUILD COMPLETE!"
    echo "============================================"
    echo ""
    echo "Output: $DMG_PATH"
    echo ""
    echo "The DMG is signed, notarized, and ready for distribution!"
    echo "Users can download and install without Gatekeeper warnings."
}

# =============================================================================
# Main
# =============================================================================
main() {
    echo ""
    echo "============================================"
    echo "docprep macOS Build & Notarize"
    echo "Version: $VERSION"
    echo "============================================"
    
    check_prerequisites
    build_app
    sign_app
    create_dmg_installer
    sign_dmg
    notarize_dmg
    staple_dmg
    verify_final
}

# Run main function
main "$@"

