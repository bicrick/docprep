/**
 * Update Notice Component
 * Shows a subtle notification when an update is available
 * Supports in-app download and installation with progress
 */

// Track update state
let updateState = {
    available: false,
    version: '',
    downloadUrl: '',
    releaseNotes: '',
    isDownloading: false,
    isInstalling: false,
    downloadPercent: 0,
    error: null
};

export function UpdateNotice() {
    return `
    <div class="update-notice" id="updateNotice" style="display: none;">
        <div class="update-notice-content">
            <span class="update-notice-icon" id="updateIcon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v10m0 0l-3-3m3 3l3-3"/>
                    <path d="M20 21H4a2 2 0 01-2-2V5a2 2 0 012-2"/>
                    <circle cx="12" cy="17" r="1"/>
                </svg>
            </span>
            <span class="update-notice-text" id="updateText">
                Update available: <span id="updateVersion">v0.0.0</span>
            </span>
            <div class="update-notice-progress" id="updateProgress" style="display: none;">
                <div class="update-notice-progress-bar">
                    <div class="update-notice-progress-fill" id="updateProgressFill"></div>
                </div>
                <span class="update-notice-progress-text" id="updateProgressText">0%</span>
            </div>
            <button class="update-notice-btn" id="btnInstallUpdate">
                Install Now
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
 * Show the update notice (called when on welcome screen)
 */
export function showUpdateNotice() {
    const notice = document.getElementById('updateNotice');
    if (!notice) return;
    
    // Only show if update is available and not dismissed
    if (updateState.available && sessionStorage.getItem('updateDismissed') !== 'true') {
        notice.style.display = 'flex';
    }
}

/**
 * Hide the update notice (called when leaving welcome screen)
 */
export function hideUpdateNotice() {
    const notice = document.getElementById('updateNotice');
    if (notice) {
        notice.style.display = 'none';
    }
}

/**
 * Update the UI based on current state
 */
function updateUI() {
    const notice = document.getElementById('updateNotice');
    const textEl = document.getElementById('updateText');
    const progressEl = document.getElementById('updateProgress');
    const progressFill = document.getElementById('updateProgressFill');
    const progressText = document.getElementById('updateProgressText');
    const btnInstall = document.getElementById('btnInstallUpdate');
    const btnDismiss = document.getElementById('btnDismissUpdate');
    const iconEl = document.getElementById('updateIcon');
    
    if (!notice) return;
    
    if (updateState.error) {
        // Error state
        textEl.innerHTML = `<span class="update-error">Update failed</span>`;
        progressEl.style.display = 'none';
        btnInstall.textContent = 'Retry';
        btnInstall.disabled = false;
        btnInstall.style.display = 'inline-flex';
        btnDismiss.style.display = 'flex';
        notice.classList.add('update-notice-error');
        notice.classList.remove('update-notice-installing');
    } else if (updateState.isInstalling) {
        // Installing state
        textEl.innerHTML = `<span>Installing update...</span>`;
        progressEl.style.display = 'none';
        btnInstall.style.display = 'none';
        btnDismiss.style.display = 'none';
        notice.classList.add('update-notice-installing');
        notice.classList.remove('update-notice-error');
        // Show spinner icon
        iconEl.innerHTML = `
            <svg class="spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"/>
            </svg>
        `;
    } else if (updateState.isDownloading) {
        // Downloading state
        textEl.innerHTML = `<span>Downloading update...</span>`;
        progressEl.style.display = 'flex';
        progressFill.style.width = `${updateState.downloadPercent}%`;
        progressText.textContent = `${updateState.downloadPercent}%`;
        btnInstall.style.display = 'none';
        btnDismiss.style.display = 'none';
        notice.classList.remove('update-notice-error');
        notice.classList.remove('update-notice-installing');
    } else if (updateState.available) {
        // Available state (default)
        textEl.innerHTML = `Update available: <span id="updateVersion">v${updateState.version}</span>`;
        progressEl.style.display = 'none';
        btnInstall.textContent = 'Install Now';
        btnInstall.disabled = false;
        btnInstall.style.display = 'inline-flex';
        btnDismiss.style.display = 'flex';
        notice.classList.remove('update-notice-error');
        notice.classList.remove('update-notice-installing');
        // Restore default icon
        iconEl.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v10m0 0l-3-3m3 3l3-3"/>
                <path d="M20 21H4a2 2 0 01-2-2V5a2 2 0 012-2"/>
                <circle cx="12" cy="17" r="1"/>
            </svg>
        `;
    }
}

/**
 * Initialize update notice functionality
 */
export function initUpdateNotice() {
    const notice = document.getElementById('updateNotice');
    const btnInstall = document.getElementById('btnInstallUpdate');
    const btnDismiss = document.getElementById('btnDismissUpdate');
    
    if (!notice) return;
    
    // Install button click
    btnInstall?.addEventListener('click', async () => {
        if (updateState.isDownloading || updateState.isInstalling) return;
        
        // Reset error state if retrying
        updateState.error = null;
        updateState.isDownloading = true;
        updateState.downloadPercent = 0;
        updateUI();
        
        if (window.pywebview) {
            try {
                await window.pywebview.api.download_and_install_update();
            } catch (e) {
                console.error('Failed to start update:', e);
                updateState.isDownloading = false;
                updateState.error = 'Failed to start update';
                updateUI();
            }
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
        // Don't check if already dismissed this session
        if (sessionStorage.getItem('updateDismissed') === 'true') {
            return;
        }
        
        if (window.pywebview) {
            try {
                const updateInfo = await window.pywebview.api.check_for_updates();
                
                if (updateInfo && updateInfo.is_newer) {
                    // Store update info
                    updateState.available = true;
                    updateState.version = updateInfo.version;
                    updateState.downloadUrl = updateInfo.download_url;
                    updateState.releaseNotes = updateInfo.release_notes;
                    
                    // Update UI
                    updateUI();
                    
                    // Show notice (only if on welcome screen - controlled by showSlide)
                    // The notice will be shown by showUpdateNotice() when appropriate
                    notice.style.display = 'flex';
                }
            } catch (e) {
                console.warn('Failed to check for updates:', e);
            }
        }
    }, 2000); // Check 2 seconds after load
}

// ============================================
// Callback functions called from Python
// ============================================

/**
 * Update download progress (called from Python)
 */
function updateDownloadProgress(percent) {
    updateState.downloadPercent = percent;
    updateState.isDownloading = true;
    updateState.isInstalling = false;
    updateState.error = null;
    updateUI();
}

/**
 * Signal that installation has started (called from Python)
 */
function updateInstallStarted() {
    updateState.isDownloading = false;
    updateState.isInstalling = true;
    updateState.error = null;
    updateUI();
}

/**
 * Signal that installation is complete (called from Python)
 * App will relaunch shortly after this
 */
function updateInstallComplete() {
    updateState.isInstalling = true;
    const textEl = document.getElementById('updateText');
    if (textEl) {
        textEl.innerHTML = `<span>Restarting...</span>`;
    }
}

/**
 * Signal that an error occurred (called from Python)
 */
function updateInstallError(message) {
    updateState.isDownloading = false;
    updateState.isInstalling = false;
    updateState.error = message || 'Update failed';
    updateUI();
}

// Expose callbacks to window for Python to call
window.updateDownloadProgress = updateDownloadProgress;
window.updateInstallStarted = updateInstallStarted;
window.updateInstallComplete = updateInstallComplete;
window.updateInstallError = updateInstallError;
