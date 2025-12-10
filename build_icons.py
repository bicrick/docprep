#!/usr/bin/env python3
"""
Build icons for Mac (.icns) and Windows (.ico) from source PNG.
Run this before building with PyInstaller.

Usage: python build_icons.py
"""

import os
import shutil
import subprocess
import platform
from pathlib import Path

from PIL import Image


# Icon sizes needed for each platform
ICNS_SIZES = [16, 32, 64, 128, 256, 512, 1024]  # Mac
ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]      # Windows

SOURCE_IMAGE = "docprep_icon_transparent.png"
OUTPUT_DIR = "icons"


def create_output_dir():
    """Create the icons output directory."""
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(exist_ok=True)
    return output_path


def resize_image(img: Image.Image, size: int) -> Image.Image:
    """Resize image to square size with high quality."""
    return img.resize((size, size), Image.Resampling.LANCZOS)


def build_ico(source_img: Image.Image, output_path: Path):
    """Build Windows .ico file with multiple sizes."""
    ico_path = output_path / "docprep.ico"
    
    # Create list of resized images
    images = []
    for size in ICO_SIZES:
        resized = resize_image(source_img, size)
        images.append(resized)
    
    # Save as ICO with all sizes
    # The first image is used as the base, others are appended
    images[0].save(
        ico_path,
        format="ICO",
        sizes=[(img.width, img.height) for img in images],
        append_images=images[1:]
    )
    
    print(f"Created: {ico_path}")
    print(f"  Sizes: {ICO_SIZES}")


def build_icns(source_img: Image.Image, output_path: Path):
    """Build Mac .icns file using iconutil."""
    icns_path = output_path / "docprep.icns"
    iconset_path = output_path / "docprep.iconset"
    
    # Create iconset directory
    if iconset_path.exists():
        shutil.rmtree(iconset_path)
    iconset_path.mkdir()
    
    # Mac iconset requires specific naming:
    # icon_16x16.png, icon_16x16@2x.png (32px), icon_32x32.png, icon_32x32@2x.png (64px), etc.
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
        resized = resize_image(source_img, size)
        resized.save(iconset_path / filename, "PNG")
    
    print(f"Created iconset: {iconset_path}")
    
    # Use iconutil to create .icns (macOS only)
    if platform.system() == "Darwin":
        try:
            subprocess.run(
                ["iconutil", "-c", "icns", str(iconset_path), "-o", str(icns_path)],
                check=True
            )
            print(f"Created: {icns_path}")
            
            # Clean up iconset directory
            shutil.rmtree(iconset_path)
        except subprocess.CalledProcessError as e:
            print(f"Error running iconutil: {e}")
            print("The iconset folder has been preserved for manual conversion.")
    else:
        print(f"Note: .icns creation requires macOS. Iconset saved at: {iconset_path}")
        print("  To create .icns on Mac, run: iconutil -c icns icons/docprep.iconset")


def main():
    """Main entry point."""
    source_path = Path(SOURCE_IMAGE)
    
    if not source_path.exists():
        print(f"Error: Source image not found: {SOURCE_IMAGE}")
        return 1
    
    print(f"Loading source image: {SOURCE_IMAGE}")
    source_img = Image.open(source_path)
    
    # Ensure RGBA mode for transparency
    if source_img.mode != "RGBA":
        source_img = source_img.convert("RGBA")
    
    print(f"Source size: {source_img.size}")
    
    # Create output directory
    output_path = create_output_dir()
    print(f"Output directory: {output_path}")
    
    # Build icons
    print("\nBuilding Windows .ico...")
    build_ico(source_img, output_path)
    
    print("\nBuilding Mac .icns...")
    build_icns(source_img, output_path)
    
    print("\nDone!")
    return 0


if __name__ == "__main__":
    exit(main())
