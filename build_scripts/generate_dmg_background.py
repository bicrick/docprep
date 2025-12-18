#!/usr/bin/env python3
"""
Generate DMG background image with a white bubble pattern and install arrow
"""

import random
import math
from PIL import Image, ImageDraw

def draw_arrow(draw, start_x, end_x, y, color, thickness=3, head_size=15):
    """
    Draw a horizontal arrow pointing right.
    
    Args:
        draw: PIL ImageDraw object
        start_x: Starting x position
        end_x: Ending x position (arrow tip)
        y: Vertical position
        color: Arrow color (RGBA tuple)
        thickness: Line thickness
        head_size: Size of the arrowhead
    """
    # Draw the line
    draw.line([(start_x, y), (end_x - head_size, y)], fill=color, width=thickness)
    
    # Draw the arrowhead (triangle)
    arrow_points = [
        (end_x, y),  # tip
        (end_x - head_size, y - head_size // 2 - 2),  # top
        (end_x - head_size, y + head_size // 2 + 2),  # bottom
    ]
    draw.polygon(arrow_points, fill=color)


def generate_dmg_background(output_path="dmg_background.png", width=660, height=400):
    """
    Generate a DMG background image with white background, subtle gray bubbles,
    and an arrow pointing from app to Applications folder.
    
    Args:
        output_path: Path to save the PNG file
        width: Image width (default 660 for standard DMG)
        height: Image height (default 400 for standard DMG)
    """
    # White background color
    bg_color = (255, 255, 255)  # #ffffff
    
    # Create image
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img, 'RGBA')
    
    # Bubble configuration
    config = {
        'count': 18,
        'min_size': 40,
        'max_size': 280,
        'min_opacity': 12,   # out of 255
        'max_opacity': 25,  # out of 255
        'padding': 5
    }
    
    placed_bubbles = []
    
    # Reserve space for the arrow (center area)
    arrow_y = 185  # Slightly above icon center since icons have labels below
    arrow_start = 245  # After app icon (at x=180, ~100px wide)
    arrow_end = 415    # Before Applications folder (at x=480)
    
    def check_overlap(x, y, radius):
        """Check if a new bubble overlaps with existing ones or the arrow zone"""
        # Check arrow zone (with padding)
        if arrow_start - 30 < x < arrow_end + 30 and arrow_y - 40 < y < arrow_y + 40:
            return True
        
        for bx, by, br in placed_bubbles:
            distance = math.sqrt((x - bx) ** 2 + (y - by) ** 2)
            min_distance = radius + br + config['padding']
            if distance < min_distance:
                return True
        return False
    
    attempts = 0
    max_attempts = 500
    
    while len(placed_bubbles) < config['count'] and attempts < max_attempts:
        attempts += 1
        
        # Random position across the image
        x = random.randint(0, width)
        y = random.randint(0, height)
        
        # Random size
        size = random.randint(config['min_size'], config['max_size'])
        radius = size // 2
        
        # Check for overlap
        if check_overlap(x, y, radius):
            continue
        
        # Random opacity
        opacity = random.randint(config['min_opacity'], config['max_opacity'])
        
        # Draw the bubble (gray on white background)
        bubble_color = (180, 180, 180, opacity)
        
        # Draw filled circle
        draw.ellipse(
            [x - radius, y - radius, x + radius, y + radius],
            fill=bubble_color
        )
        
        placed_bubbles.append((x, y, radius))
    
    # Draw the arrow (gray color to match the subtle theme)
    arrow_color = (160, 160, 160, 255)
    draw_arrow(draw, arrow_start, arrow_end, arrow_y, arrow_color, thickness=3, head_size=18)
    
    # Save the image
    img.save(output_path, 'PNG')
    print(f"Generated DMG background: {output_path}")
    print(f"  Size: {width}x{height}")
    print(f"  Bubbles: {len(placed_bubbles)}")


if __name__ == '__main__':
    generate_dmg_background()








