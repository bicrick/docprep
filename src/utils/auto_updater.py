"""
Auto-updater module for DocPrep
Handles downloading, installing, and relaunching updates on macOS
"""

import logging
import os
import subprocess
import sys
import tempfile
import urllib.request
import urllib.error
from pathlib import Path
from typing import Callable, Optional

logger = logging.getLogger(__name__)


def download_update(url: str, progress_callback: Optional[Callable[[int, int], None]] = None) -> Optional[str]:
    """
    Download DMG update file to temp folder.
    
    Args:
        url: URL to the DMG file
        progress_callback: Optional callback(bytes_downloaded, total_bytes) for progress updates
    
    Returns:
        Path to downloaded DMG file, or None if download failed
    """
    try:
        logger.info(f"Downloading update from: {url}")
        
        # Create temp file for download
        temp_dir = tempfile.gettempdir()
        filename = url.split('/')[-1]
        if not filename.endswith('.dmg'):
            filename = 'DocPrep-update.dmg'
        dmg_path = os.path.join(temp_dir, filename)
        
        # Create request with headers
        request = urllib.request.Request(
            url,
            headers={'User-Agent': 'DocPrep-AutoUpdater'}
        )
        
        # Open URL and get content length
        with urllib.request.urlopen(request, timeout=60) as response:
            total_size = int(response.headers.get('Content-Length', 0))
            downloaded = 0
            block_size = 8192
            
            with open(dmg_path, 'wb') as f:
                while True:
                    block = response.read(block_size)
                    if not block:
                        break
                    f.write(block)
                    downloaded += len(block)
                    
                    if progress_callback and total_size > 0:
                        progress_callback(downloaded, total_size)
        
        logger.info(f"Download complete: {dmg_path}")
        return dmg_path
        
    except urllib.error.URLError as e:
        logger.error(f"Failed to download update (network error): {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to download update: {e}")
        return None


def install_update(dmg_path: str, app_name: str = "DocPrep") -> bool:
    """
    Install update from DMG file to /Applications.
    
    This function:
    1. Mounts the DMG
    2. Copies the .app bundle to /Applications with admin privileges
    3. Unmounts the DMG
    
    Args:
        dmg_path: Path to the DMG file
        app_name: Name of the application (without .app extension)
    
    Returns:
        True if installation succeeded, False otherwise
    """
    mount_point = None
    
    try:
        logger.info(f"Installing update from: {dmg_path}")
        
        # Mount the DMG
        mount_result = subprocess.run(
            ['hdiutil', 'attach', dmg_path, '-nobrowse', '-quiet'],
            capture_output=True,
            text=True
        )
        
        if mount_result.returncode != 0:
            logger.error(f"Failed to mount DMG: {mount_result.stderr}")
            return False
        
        # Find the mount point
        mount_info = subprocess.run(
            ['hdiutil', 'info'],
            capture_output=True,
            text=True
        )
        
        # Parse mount info to find our DMG's mount point
        lines = mount_info.stdout.split('\n')
        found_dmg = False
        for line in lines:
            if dmg_path in line:
                found_dmg = True
            elif found_dmg and '/Volumes/' in line:
                # Extract mount point from line like "/dev/disk4s1	Apple_HFS	/Volumes/DocPrep"
                parts = line.split('\t')
                if len(parts) >= 3:
                    mount_point = parts[-1].strip()
                    break
        
        if not mount_point:
            # Fallback: try common mount point pattern
            mount_point = f"/Volumes/{app_name}"
            if not os.path.exists(mount_point):
                logger.error("Could not find DMG mount point")
                return False
        
        logger.info(f"DMG mounted at: {mount_point}")
        
        # Find the .app bundle in the mounted volume
        app_bundle = None
        for item in os.listdir(mount_point):
            if item.endswith('.app'):
                app_bundle = os.path.join(mount_point, item)
                break
        
        if not app_bundle:
            logger.error("No .app bundle found in DMG")
            _unmount_dmg(mount_point)
            return False
        
        app_bundle_name = os.path.basename(app_bundle)
        destination = f"/Applications/{app_bundle_name}"
        
        logger.info(f"Installing {app_bundle_name} to /Applications")
        
        # Use osascript to copy with admin privileges
        # First remove old version, then copy new version
        script = f'''
        do shell script "rm -rf '{destination}' && cp -R '{app_bundle}' '/Applications/'" with administrator privileges
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            # User cancelled or error
            if 'User canceled' in result.stderr or 'cancelled' in result.stderr.lower():
                logger.info("User cancelled admin authentication")
            else:
                logger.error(f"Failed to install: {result.stderr}")
            _unmount_dmg(mount_point)
            return False
        
        logger.info("Installation complete")
        
        # Unmount the DMG
        _unmount_dmg(mount_point)
        
        # Clean up downloaded DMG
        try:
            os.remove(dmg_path)
            logger.info("Cleaned up downloaded DMG")
        except Exception:
            pass
        
        return True
        
    except Exception as e:
        logger.error(f"Installation failed: {e}")
        if mount_point:
            _unmount_dmg(mount_point)
        return False


def _unmount_dmg(mount_point: str) -> None:
    """Unmount a DMG volume."""
    try:
        subprocess.run(
            ['hdiutil', 'detach', mount_point, '-quiet'],
            capture_output=True,
            timeout=10
        )
        logger.info(f"Unmounted: {mount_point}")
    except Exception as e:
        logger.warning(f"Failed to unmount DMG: {e}")


def relaunch_app(app_name: str = "DocPrep") -> None:
    """
    Launch the new version of the app from /Applications and exit current process.
    
    Args:
        app_name: Name of the application (without .app extension)
    """
    app_path = f"/Applications/{app_name}.app"
    
    logger.info(f"Relaunching app from: {app_path}")
    
    try:
        # Use 'open' command to launch the app
        # Use -n to open a new instance
        subprocess.Popen(
            ['open', '-n', app_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Give the new app a moment to start
        import time
        time.sleep(0.5)
        
        # Exit current process
        logger.info("Exiting current process")
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"Failed to relaunch app: {e}")
        # Don't exit if relaunch failed - let user handle it


def get_current_app_path() -> Optional[str]:
    """
    Get the path to the currently running app bundle.
    
    Returns:
        Path to the .app bundle, or None if not running from an app bundle
    """
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle
        # sys.executable points to the binary inside the .app bundle
        # e.g., /Applications/DocPrep.app/Contents/MacOS/DocPrep
        executable = sys.executable
        
        # Navigate up to find .app bundle
        path = Path(executable)
        for parent in path.parents:
            if parent.suffix == '.app':
                return str(parent)
    
    return None







