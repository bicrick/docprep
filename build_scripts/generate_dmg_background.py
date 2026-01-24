#!/usr/bin/env python3
"""
Generate a DMG background image (660x400) styled like the ComfyUI installer:
- light gray background
- two subtle rounded "tiles" behind the app + Applications icons
- dashed-outline arrow pointing from app to Applications
"""

import math
import argparse
from PIL import Image, ImageDraw, ImageFilter

def _draw_dashed_line(draw: ImageDraw.ImageDraw, p1, p2, *, fill, width: int, dash=(6, 6)):
    """Draw a dashed line between two points."""
    x1, y1 = p1
    x2, y2 = p2
    dx = x2 - x1
    dy = y2 - y1
    dist = math.hypot(dx, dy)
    if dist == 0:
        return

    dash_len, gap_len = dash
    step = dash_len + gap_len
    ux = dx / dist
    uy = dy / dist

    t = 0.0
    while t < dist:
        seg_start = t
        seg_end = min(t + dash_len, dist)
        sx = x1 + ux * seg_start
        sy = y1 + uy * seg_start
        ex = x1 + ux * seg_end
        ey = y1 + uy * seg_end
        draw.line([(sx, sy), (ex, ey)], fill=fill, width=width)
        t += step


def _draw_dashed_arrow(draw: ImageDraw.ImageDraw, *, start_x: int, end_x: int, y: int, color, thickness: int = 3):
    """Draw a simple dashed-outline arrow (shaft + open chevron head)."""
    head_len = 18
    head_half_height = 12
    shaft_end_x = end_x - head_len

    _draw_dashed_line(draw, (start_x, y), (shaft_end_x, y), fill=color, width=thickness, dash=(7, 7))
    _draw_dashed_line(
        draw,
        (end_x, y),
        (shaft_end_x, y - head_half_height),
        fill=color,
        width=thickness,
        dash=(7, 7),
    )
    _draw_dashed_line(
        draw,
        (end_x, y),
        (shaft_end_x, y + head_half_height),
        fill=color,
        width=thickness,
        dash=(7, 7),
    )

def generate_dmg_background(output_path="dmg_background.png", width=660, height=400):
    """
    Generate a DMG background image with a ComfyUI-like style.

    Args:
        output_path: Path to save the PNG file
        width: Image width (default 660 for standard DMG)
        height: Image height (default 400 for standard DMG)
    """
    # Finder window style: light, neutral background
    bg_color = (241, 241, 241)  # ~ #f1f1f1
    img = Image.new("RGB", (width, height), bg_color)

    # Tiles sit behind the two icons (positions match build_scripts/build_dmg.sh)
    app_x, app_y = 180, 200
    apps_x, apps_y = 480, 200

    tile_w = 180
    tile_h = 180
    # Place tile a bit above the icon anchor to avoid the label area
    tile_center_y = 160

    tile_fill = (232, 232, 232)     # slightly lighter than bg
    tile_border = (220, 220, 220)   # subtle edge
    shadow_color = (0, 0, 0, 55)     # soft shadow
    shadow_offset = (0, 6)
    shadow_blur = 10
    radius = 22

    # Shadow layer
    shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow, "RGBA")

    def tile_rect(center_x: int):
        left = int(center_x - tile_w / 2)
        top = int(tile_center_y - tile_h / 2)
        right = left + tile_w
        bottom = top + tile_h
        return left, top, right, bottom

    for cx in (app_x, apps_x):
        l, t, r, b = tile_rect(cx)
        shadow_draw.rounded_rectangle(
            [l + shadow_offset[0], t + shadow_offset[1], r + shadow_offset[0], b + shadow_offset[1]],
            radius=radius,
            fill=shadow_color,
        )

    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=shadow_blur))
    img = Image.alpha_composite(img.convert("RGBA"), shadow)

    # Tile layer
    draw = ImageDraw.Draw(img, "RGBA")
    for cx in (app_x, apps_x):
        l, t, r, b = tile_rect(cx)
        draw.rounded_rectangle([l, t, r, b], radius=radius, fill=tile_fill)
        draw.rounded_rectangle([l, t, r, b], radius=radius, outline=tile_border, width=1)

    # Dashed-outline arrow between tiles
    arrow_y = tile_center_y
    arrow_start = int(app_x + tile_w / 2 + 22)
    arrow_end = int(apps_x - tile_w / 2 - 22)
    arrow_color = (120, 120, 120, 255)
    _draw_dashed_arrow(draw, start_x=arrow_start, end_x=arrow_end, y=arrow_y, color=arrow_color, thickness=3)

    img.convert("RGB").save(output_path, "PNG")
    print(f"Generated DMG background: {output_path}")
    print(f"  Size: {width}x{height}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Generate DMG background PNG.")
    parser.add_argument("--output", default="dmg_background.png", help="Output PNG path.")
    parser.add_argument("--width", type=int, default=660, help="Image width.")
    parser.add_argument("--height", type=int, default=400, help="Image height.")
    args = parser.parse_args()
    generate_dmg_background(output_path=args.output, width=args.width, height=args.height)








