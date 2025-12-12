/**
 * Update Notice Component
 * Shows a subtle notification when an update is available
 */

export function UpdateNotice() {
    return `
    <div class="update-notice" id="updateNotice" style="display: none;">
        <div class="update-notice-content">
            <span class="update-notice-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v10m0 0l-3-3m3 3l3-3"/>
                    <path d="M20 21H4a2 2 0 01-2-2V5a2 2 0 012-2"/>
                    <circle cx="12" cy="17" r="1"/>
                </svg>
            </span>
            <span class="update-notice-text">
                Update available: <span id="updateVersion">v0.0.0</span>
            </span>
            <button class="update-notice-btn" id="btnDownloadUpdate">
                Download
            </button>
            <button class="update-notice-dismiss" id="btnDismissUpdate" aria-label="Dismiss">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
    </div>`;
}

/**
 * Initialize update notice functionality
 */
export function initUpdateNotice() {
    const notice = document.getElementById('updateNotice');
    const btnDownload = document.getElementById('btnDownloadUpdate');
    const btnDismiss = document.getElementById('btnDismissUpdate');
    
    if (!notice) return;
    
    // Store download URL for the button
    let downloadUrl = '';
    
    // Download button click
    btnDownload?.addEventListener('click', async () => {
        if (downloadUrl && window.pywebview) {
            await window.pywebview.api.open_download_url(downloadUrl);
        }
    });
    
    // Dismiss button click
    btnDismiss?.addEventListener('click', () => {
        notice.style.display = 'none';
        // Remember dismissal in session
        sessionStorage.setItem('updateDismissed', 'true');
    });
    
    // Check for updates on load (after a short delay)
    setTimeout(async () => {
        // Don't show if already dismissed this session
        if (sessionStorage.getItem('updateDismissed') === 'true') {
            return;
        }
        
        if (window.pywebview) {
            try {
                const updateInfo = await window.pywebview.api.check_for_updates();
                
                if (updateInfo && updateInfo.is_newer) {
                    // Show the notice
                    const versionEl = document.getElementById('updateVersion');
                    if (versionEl) {
                        versionEl.textContent = `v${updateInfo.version}`;
                    }
                    downloadUrl = updateInfo.download_url;
                    notice.style.display = 'flex';
                }
            } catch (e) {
                console.warn('Failed to check for updates:', e);
            }
        }
    }, 2000); // Check 2 seconds after load
}

