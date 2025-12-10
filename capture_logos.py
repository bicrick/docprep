#!/usr/bin/env python3
"""
Capture docprep logos to PNG files.
Requires: pip install playwright
Then run: playwright install chromium
"""

import asyncio
from pathlib import Path

async def capture_logos():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Installing playwright...")
        import subprocess
        subprocess.run(["pip", "install", "playwright"], check=True)
        subprocess.run(["playwright", "install", "chromium"], check=True)
        from playwright.async_api import async_playwright
    
    output_dir = Path(__file__).parent / "logo_exports"
    output_dir.mkdir(exist_ok=True)
    
    html_file = Path(__file__).parent / "logo_generator.html"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Load the HTML file
        await page.goto(f"file://{html_file.absolute()}")
        
        # Wait for fonts to load
        await page.wait_for_timeout(2000)
        
        # Capture each logo element
        logos_to_capture = [
            ("icon-1024", "docprep_icon_1024.png"),
            ("icon-512", "docprep_icon_512.png"),
            ("icon-256", "docprep_icon_256.png"),
            ("icon-128", "docprep_icon_128.png"),
            ("logo-full", "docprep_logo_full.png"),
            ("logo-medium", "docprep_logo_medium.png"),
        ]
        
        for element_id, filename in logos_to_capture:
            element = page.locator(f"#{element_id}")
            output_path = output_dir / filename
            await element.screenshot(path=str(output_path))
            print(f"Saved: {output_path}")
        
        await browser.close()
    
    print(f"\nAll logos saved to: {output_dir}")

if __name__ == "__main__":
    asyncio.run(capture_logos())
