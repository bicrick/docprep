"""
Update checker module for DocPrep
Checks GitHub Pages for new versions and notifies users
"""

import json
import logging
import urllib.request
import urllib.error
from typing import Optional, Dict
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Update manifest URL - configured in config.py
# This is a fallback; prefer importing from config
UPDATE_URL = "https://pub-7075773554534e1ea27cd98fe79bcfca.r2.dev/updates.json"


@dataclass
class UpdateInfo:
    """Information about an available update"""
    version: str
    download_url: str
    release_notes: str
    is_newer: bool


def parse_version(version_str: str) -> tuple:
    """
    Parse a semantic version string into a comparable tuple.
    
    Args:
        version_str: Version string like "1.0.0" or "1.2.3"
    
    Returns:
        Tuple of integers (major, minor, patch)
    """
    try:
        parts = version_str.strip().lstrip('v').split('.')
        return tuple(int(p) for p in parts[:3])
    except (ValueError, AttributeError):
        return (0, 0, 0)


def compare_versions(current: str, remote: str) -> int:
    """
    Compare two version strings.
    
    Args:
        current: Current version string
        remote: Remote version string
    
    Returns:
        -1 if current < remote (update available)
         0 if current == remote (up to date)
         1 if current > remote (ahead)
    """
    current_tuple = parse_version(current)
    remote_tuple = parse_version(remote)
    
    if current_tuple < remote_tuple:
        return -1
    elif current_tuple > remote_tuple:
        return 1
    return 0


def check_for_updates(current_version: str, update_url: str = None) -> Optional[UpdateInfo]:
    """
    Check for available updates.
    
    Args:
        current_version: The current app version (e.g., "1.0.0")
        update_url: Optional custom URL for the update manifest
    
    Returns:
        UpdateInfo if an update is available, None otherwise
    """
    url = update_url or UPDATE_URL
    
    try:
        logger.debug(f"Checking for updates at: {url}")
        
        # Create request with timeout
        request = urllib.request.Request(
            url,
            headers={'User-Agent': 'DocPrep-UpdateChecker'}
        )
        
        with urllib.request.urlopen(request, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        remote_version = data.get('version', '0.0.0')
        download_url = data.get('download_url', '')
        release_notes = data.get('release_notes', '')
        
        comparison = compare_versions(current_version, remote_version)
        is_newer = comparison < 0
        
        if is_newer:
            logger.info(f"Update available: {current_version} -> {remote_version}")
        else:
            logger.debug(f"App is up to date (current: {current_version}, remote: {remote_version})")
        
        return UpdateInfo(
            version=remote_version,
            download_url=download_url,
            release_notes=release_notes,
            is_newer=is_newer
        )
        
    except urllib.error.URLError as e:
        logger.warning(f"Failed to check for updates (network error): {e}")
        return None
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse update manifest: {e}")
        return None
    except Exception as e:
        logger.warning(f"Unexpected error checking for updates: {e}")
        return None


def get_update_info_dict(current_version: str, update_url: str = None) -> Optional[Dict]:
    """
    Check for updates and return as a dictionary (for JSON serialization).
    
    Args:
        current_version: The current app version
        update_url: Optional custom URL for the update manifest
    
    Returns:
        Dictionary with update info, or None if no update or error
    """
    update_info = check_for_updates(current_version, update_url)
    
    if update_info is None:
        return None
    
    return {
        'version': update_info.version,
        'download_url': update_info.download_url,
        'release_notes': update_info.release_notes,
        'is_newer': update_info.is_newer
    }




