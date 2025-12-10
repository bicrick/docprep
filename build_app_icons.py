#!/usr/bin/env python3
"""
Build app icons with rounded corners for Mac (.icns) and Windows (.ico).
Uses the pre-exported logos from logo_exports/ directory.

Usage: python build_app_icons.py
"""

import os
import shutil
import subprocess
import platform
from pathlib import Path

from PIL import Image, ImageDraw


# Source directory with exported logos
SOURCE_DIR = "extracted_logos"
OUTPUT_DIR = "icons"

# Corner radius as a percentage of icon size (macOS style is ~22%)
CORNER_RADIUS_PERCENT = 22

# Padding percentage - how much smaller the logo should be relative to icon size
# Higher value = more padding (logo is smaller). Teams-style is around 20-25% padding
PADDING_PERCENT = 25  # Logo will be 75% of icon size, with 25% total padding (12.5% on each side)

# Sizes needed for each platform
ICNS_SIZES = [16, 32, 64, 128, 256, 512, 1024]
# Windows .ico - only include useful sizes (skip tiny ones)
ICO_SIZES = [256, 128, 64, 48]


def add_rounded_corners(img: Image.Image, radius_percent: float = 22) -> Image.Image:
    """
    Add rounded corners to an image (macOS app icon style).
    
    Args:
        img: Source image (should be square)
        radius_percent: Corner radius as percentage of image size
    
    Returns:
        Image with rounded corners and transparent background
    """
    size = img.size[0]
    radius = int(size * radius_percent / 100)
    
    # Ensure RGBA mode
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    
    # Create a mask with rounded corners
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    # Draw rounded rectangle on mask
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=255
    )
    
    # Apply mask to create transparent corners
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask)
    
    return output


def resize_with_padding_and_corners(source_img: Image.Image, size: int) -> Image.Image:
    """
    Resize image with padding and add rounded corners.
    The logo will be smaller than the icon size, centered with transparent padding.
    """
    # Calculate logo size with padding
    logo_size = int(size * (100 - PADDING_PERCENT) / 100)
    
    # Resize the source image to the logo size
    resized_logo = source_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Apply rounded corners to the logo itself (so the blue square has rounded corners)
    resized_logo = add_rounded_corners(resized_logo, CORNER_RADIUS_PERCENT)
    
    # Create a transparent canvas of the full icon size
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # Calculate position to center the logo
    offset = (size - logo_size) // 2
    
    # Paste the logo centered on the transparent canvas
    canvas.paste(resized_logo, (offset, offset), resized_logo if resized_logo.mode == "RGBA" else None)
    
    # Add rounded corners to the final icon boundary as well
    return add_rounded_corners(canvas, CORNER_RADIUS_PERCENT)


def get_best_source(target_size: int, sources: dict) -> Image.Image:
    """
    Get the best source image for a target size.
    Prefers larger sources to avoid upscaling.
    """
    available_sizes = sorted(sources.keys(), reverse=True)
    
    # Find smallest source that's >= target size
    for src_size in reversed(available_sizes):
        if src_size >= target_size:
            return sources[src_size]
    
    # Fall back to largest available
    return sources[available_sizes[0]]


def load_sources() -> dict:
    """Load source images from source directory."""
    source_path = Path(SOURCE_DIR)
    sources = {}
    
    # Try to find logo files - check both specific names and any PNG files
    size_files = {
        1024: "docprep_icon_1024.png",
        512: "docprep_icon_512.png",
        256: "docprep_icon_256.png",
        128: "docprep_icon_128.png",
    }
    
    # First try specific filenames
    for size, filename in size_files.items():
        filepath = source_path / filename
        if filepath.exists():
            sources[size] = Image.open(filepath)
            print(f"  Loaded: {filename} ({size}x{size})")
    
    # If no specific files found, try to find any PNG files and use the largest one
    if not sources:
        png_files = list(source_path.glob("*.png"))
        if png_files:
            # Use the largest PNG file found
            largest_file = max(png_files, key=lambda f: f.stat().st_size)
            img = Image.open(largest_file)
            # Determine size from image dimensions
            width, height = img.size
            if width == height:
                sources[width] = img
                print(f"  Loaded: {largest_file.name} ({width}x{width})")
            else:
                # Use the larger dimension
                size = max(width, height)
                sources[size] = img
                print(f"  Loaded: {largest_file.name} ({width}x{height}, using as {size}x{size})")
    
    return sources


def build_ico(sources: dict, output_path: Path):
    """Build Windows .ico file with high quality (256x256 primary)."""
    ico_path = output_path / "docprep.ico"
    
    # Create images from largest to smallest
    images = []
    for size in ICO_SIZES:
        source = get_best_source(size, sources)
        img = resize_with_padding_and_corners(source, size)
        images.append(img)
        print(f"    {size}x{size}")
    
    # Save the 256x256 as the primary/only image for clean preview
    # Windows will scale it down as needed
    primary = images[0]  # 256x256
    primary.save(ico_path, format="ICO")
    
    print(f"  Created: {ico_path} (256x256)")
    
    # Also save standalone PNGs for flexibility
    for size in [256, 128]:
        png_path = output_path / f"docprep_{size}.png"
        source = get_best_source(size, sources)
        img = resize_with_padding_and_corners(source, size)
        img.save(png_path, "PNG")
        print(f"  Created: {png_path}")


def build_icns(sources: dict, output_path: Path):
    """Build Mac .icns file using iconutil."""
    icns_path = output_path / "docprep.icns"
    iconset_path = output_path / "docprep.iconset"
    
    # Create iconset directory
    if iconset_path.exists():
        shutil.rmtree(iconset_path)
    iconset_path.mkdir()
    
    # Mac iconset requires specific naming convention
    iconset_files = [
        (16, "icon_16x16.png"),
        (32, "icon_16x16@2x.png"),
        (32, "icon_32x32.png"),
        (64, "icon_32x32@2x.png"),
        (128, "icon_128x128.png"),
        (256, "icon_128x128@2x.png"),
        (256, "icon_256x256.png"),
        (512, "icon_256x256@2x.png"),
        (512, "icon_512x512.png"),
        (1024, "icon_512x512@2x.png"),
    ]
    
    for size, filename in iconset_files:
        source = get_best_source(size, sources)
        img = resize_with_padding_and_corners(source, size)
        img.save(iconset_path / filename, "PNG")
        print(f"    {filename}")
    
    print(f"  Created iconset: {iconset_path}")
    
    # Use iconutil to create .icns (macOS only)
    if platform.system() == "Darwin":
        try:
            subprocess.run(
                ["iconutil", "-c", "icns", str(iconset_path), "-o", str(icns_path)],
                check=True,
                capture_output=True
            )
            print(f"  Created: {icns_path}")
            
            # Clean up iconset directory
            shutil.rmtree(iconset_path)
            print("  Cleaned up iconset folder")
        except subprocess.CalledProcessError as e:
            print(f"  Error running iconutil: {e}")
            print("  The iconset folder has been preserved for manual conversion.")
    else:
        print(f"  Note: .icns creation requires macOS.")
        print(f"  Iconset saved at: {iconset_path}")
        print(f"  To create .icns on Mac, run: iconutil -c icns {iconset_path}")


def main():
    """Main entry point."""
    print("Building app icons with rounded corners")
    print("=" * 50)
    
    # Check source directory exists
    if not Path(SOURCE_DIR).exists():
        print(f"Error: Source directory not found: {SOURCE_DIR}")
        return 1
    
    # Load source images
    print("\nLoading source images...")
    sources = load_sources()
    
    if not sources:
        print(f"Error: No source images found in {SOURCE_DIR}/")
        print(f"Expected files: docprep_icon_1024.png, docprep_icon_512.png, docprep_icon_256.png, docprep_icon_128.png")
        return 1
    
    # Create output directory
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(exist_ok=True)
    print(f"\nOutput directory: {output_path}")
    
    # Build icons
    print("\nBuilding Windows .ico...")
    build_ico(sources, output_path)
    
    print("\nBuilding Mac .icns...")
    build_icns(sources, output_path)
    
    print("\n" + "=" * 50)
    print("Done!")
    return 0


if __name__ == "__main__":
    exit(main())
