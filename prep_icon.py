#!/usr/bin/env python3
"""Script to crop image to square and make background transparent."""

from PIL import Image, ImageFilter
import numpy as np


def crop_to_square(img):
    """Crop image to a centered square."""
    width, height = img.size
    size = min(width, height)
    
    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size
    
    return img.crop((left, top, right, bottom))


def make_background_transparent(img):
    """
    Make the background transparent.
    Removes light/white pixels aggressively.
    """
    # Convert to RGBA if not already
    img = img.convert("RGBA")
    data = np.array(img)
    
    rgb = data[:, :, :3].astype(float)
    
    # Check if pixel is "light" (high values in all channels)
    min_channel = np.min(rgb, axis=2)
    max_channel = np.max(rgb, axis=2)
    avg_channel = np.mean(rgb, axis=2)
    
    # A pixel is background if:
    # - All channels are high (light colored)
    # - Low saturation (channels are similar to each other)
    is_light = avg_channel > 200
    is_low_saturation = (max_channel - min_channel) < 50
    is_background = is_light & is_low_saturation
    
    # Also catch slightly darker grays at edges
    is_grayish = (avg_channel > 170) & ((max_channel - min_channel) < 35)
    is_background = is_background | is_grayish
    
    # Catch any very light pixels regardless of saturation
    is_very_light = avg_channel > 235
    is_background = is_background | is_very_light
    
    print(f"Pixels marked as background: {np.sum(is_background)}")
    
    # Make background pixels transparent
    data[is_background, 3] = 0
    
    return Image.fromarray(data)


def cleanup_edges(img, iterations=3):
    """
    Clean up edge artifacts by removing light pixels adjacent to transparent areas.
    """
    data = np.array(img)
    h, w = data.shape[:2]
    
    for _ in range(iterations):
        alpha = data[:, :, 3]
        rgb = data[:, :, :3].astype(float)
        avg_brightness = np.mean(rgb, axis=2)
        
        # Find pixels that are opaque
        opaque = alpha > 0
        
        # Find pixels adjacent to transparent pixels (edge pixels)
        edge_mask = np.zeros_like(opaque)
        
        # Check all 8 neighbors
        for dy in [-1, 0, 1]:
            for dx in [-1, 0, 1]:
                if dy == 0 and dx == 0:
                    continue
                # Shift and check for transparent neighbors
                shifted_alpha = np.zeros_like(alpha)
                
                src_y_start = max(0, -dy)
                src_y_end = h - max(0, dy)
                src_x_start = max(0, -dx)
                src_x_end = w - max(0, dx)
                
                dst_y_start = max(0, dy)
                dst_y_end = h - max(0, -dy)
                dst_x_start = max(0, dx)
                dst_x_end = w - max(0, -dx)
                
                shifted_alpha[dst_y_start:dst_y_end, dst_x_start:dst_x_end] = \
                    alpha[src_y_start:src_y_end, src_x_start:src_x_end]
                
                # Mark pixels that have a transparent neighbor
                has_transparent_neighbor = (shifted_alpha == 0)
                edge_mask = edge_mask | (opaque & has_transparent_neighbor)
        
        # Remove light-colored edge pixels
        light_edges = edge_mask & (avg_brightness > 180)
        data[light_edges, 3] = 0
        
        print(f"  Removed {np.sum(light_edges)} edge pixels")
    
    return Image.fromarray(data)


def main():
    input_path = "Gemini_Generated_Image_d3dbsmd3dbsmd3db.png"
    output_path = "docprep_icon_transparent.png"
    
    print(f"Loading image: {input_path}")
    img = Image.open(input_path)
    print(f"Original size: {img.size}")
    
    # Crop to square
    print("Cropping to square...")
    img = crop_to_square(img)
    print(f"Cropped size: {img.size}")
    
    # Make background transparent
    print("Making background transparent...")
    img = make_background_transparent(img)
    
    # Clean up edge artifacts
    print("Cleaning up edges...")
    img = cleanup_edges(img, iterations=3)
    
    # Save result
    img.save(output_path, "PNG")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()
