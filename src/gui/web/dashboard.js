/**
 * DocPrep - Dashboard Controller
 * Handles dashboard, history, and live extraction functionality
 */

// ============================================
// Dashboard State
// ============================================

const dashboardState = {
    history: [],
    extractImages: false, // Default: don't extract images
    currentExtraction: {
        folderName: null,
        folderPath: null,
        fileCount: 0,
        sourceTree: null,
        outputFiles: []
    }
};

// ============================================
// History Management
// ============================================

async function loadHistory() {
    if (!window.pywebview) return;
    
    try {
        const history = await window.pywebview.api.get_extraction_history();
        dashboardState.history = history || [];
        renderHistory();
    } catch (e) {
        console.error('Failed to load history:', e);
        dashboardState.history = [];
        renderHistory();
    }
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    
    if (!historyList || !historyEmpty) return;
    
    // Clear existing cards
    historyList.innerHTML = '';
    
    if (dashboardState.history.length === 0) {
        historyList.style.display = 'none';
        historyEmpty.style.display = 'flex';
        return;
    }
    
    historyList.style.display = 'flex';
    historyEmpty.style.display = 'none';
    
    // Render history cards
    dashboardState.history.forEach(record => {
        const card = createHistoryCard(record);
        historyList.appendChild(card);
    });
}

function createHistoryCard(record) {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.dataset.outputFolder = record.output_folder;
    
    // Format date
    const date = new Date(record.date);
    const dateStr = formatDate(date);
    
    card.innerHTML = `
        <div class="history-card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
            </svg>
        </div>
        <div class="history-card-info">
            <div class="history-card-name">${escapeHtml(record.input_name)}</div>
            <div class="history-card-meta">
                <span class="history-card-date">${dateStr}</span>
                <span class="history-card-stats">${record.file_count} files processed</span>
            </div>
        </div>
        <svg class="history-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
        </svg>
    `;
    
    // Click to open output folder
    card.addEventListener('click', () => {
        if (window.pywebview && record.output_folder) {
            window.pywebview.api.open_folder(record.output_folder);
        }
    });
    
    return card;
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return 'Today';
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// New Extraction Flow
// ============================================

async function startNewExtraction() {
    if (!window.pywebview) return;
    
    try {
        const result = await window.pywebview.api.select_folder();
        if (result) {
            // Store folder info
            dashboardState.currentExtraction.folderName = result.name;
            dashboardState.currentExtraction.folderPath = result.path;
            dashboardState.currentExtraction.fileCount = result.file_count;
            dashboardState.currentExtraction.outputFiles = [];
            
            // Get file tree
            const tree = await window.pywebview.api.get_scan_tree();
            dashboardState.currentExtraction.sourceTree = tree;
            
            // Initialize extraction view
            initExtractionView();
            
            // Show extraction slide
            showSlide('extraction');
            
            // Start extraction with options
            await window.pywebview.api.start_extraction({
                extract_images: dashboardState.extractImages
            });
        }
    } catch (e) {
        console.error('Failed to start extraction:', e);
    }
}

// ============================================
// Live Extraction View
// ============================================

function initExtractionView() {
    const { folderName, fileCount, sourceTree } = dashboardState.currentExtraction;
    
    // Set folder name
    document.getElementById('extractionFolderName').textContent = folderName;
    
    // Reset progress
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressPercent').textContent = '0%';
    document.getElementById('progressCount').textContent = `0 / ${fileCount} files`;
    document.getElementById('progressStatus').textContent = 'Starting...';
    
    // Set source count
    document.getElementById('sourceCount').textContent = `${fileCount} files`;
    
    // Reset output count
    document.getElementById('outputCount').textContent = '0 files';
    
    // Reset cancel button
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
        btnCancel.disabled = false;
        btnCancel.textContent = 'Cancel';
    }
    
    // Render source tree
    renderSourceTree(sourceTree);
    
    // Clear output tree
    document.getElementById('outputTree').innerHTML = '';
}

function renderSourceTree(tree) {
    const container = document.getElementById('sourceTree');
    container.innerHTML = '';
    
    if (!tree) return;
    
    // Render tree recursively
    renderTreeNode(tree, container, 0);
}

function renderTreeNode(node, container, depth) {
    if (node.type === 'folder') {
        // Render folder row
        const row = createTreeRow(node.name, 'folder', depth);
        container.appendChild(row);
        
        // Render children
        if (node.children) {
            node.children.forEach(child => {
                renderTreeNode(child, container, depth + 1);
            });
        }
    } else {
        // Render file row
        const row = createTreeRow(node.name, node.ext, depth);
        container.appendChild(row);
    }
}

function createTreeRow(name, type, depth) {
    const row = document.createElement('div');
    row.className = `finder-row ${type === 'folder' ? 'folder' : 'file'}`;
    if (depth > 0) {
        row.classList.add(`indent-${Math.min(depth, 3)}`);
    }
    
    // Get icon
    const icon = getFileIcon(type);
    
    row.innerHTML = `${icon}<span>${escapeHtml(name)}</span>`;
    return row;
}

function getFileIcon(type) {
    const icons = {
        'folder': '<svg class="icon icon-folder" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></svg>',
        '.xlsx': '<svg class="icon icon-excel" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/><path d="M7 7l4 5-4 5M12 7h5M12 12h5M12 17h5" stroke="white" stroke-width="1.5" fill="none"/></svg>',
        '.xls': '<svg class="icon icon-excel" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/><path d="M7 7l4 5-4 5M12 7h5M12 12h5M12 17h5" stroke="white" stroke-width="1.5" fill="none"/></svg>',
        '.csv': '<svg class="icon icon-csv" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#217346"/><path d="M7 8h10M7 12h10M7 16h10" stroke="white" stroke-width="1.5"/></svg>',
        '.pdf': '<svg class="icon icon-pdf" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#d63031"/><text x="12" y="15" text-anchor="middle" fill="white" font-size="7" font-weight="bold">PDF</text></svg>',
        '.docx': '<svg class="icon icon-word" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#2b579a"/><path d="M7 8l2 8 2-6 2 6 2-8" stroke="white" stroke-width="1.5" fill="none"/></svg>',
        '.doc': '<svg class="icon icon-word" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#2b579a"/><path d="M7 8l2 8 2-6 2 6 2-8" stroke="white" stroke-width="1.5" fill="none"/></svg>',
        '.pptx': '<svg class="icon icon-pptx" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#d24726"/><circle cx="10" cy="12" r="4" stroke="white" stroke-width="1.5" fill="none"/><path d="M10 8v8M14 12h4" stroke="white" stroke-width="1.5"/></svg>',
        '.txt': '<svg class="icon icon-txt" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#6b7280"/><path d="M7 8h10M7 12h7M7 16h9" stroke="white" stroke-width="1.5"/></svg>'
    };
    
    return icons[type] || icons['.txt'];
}

// Called from Python when an output file is created
function addOutputFile(fileInfo) {
    dashboardState.currentExtraction.outputFiles.push(fileInfo);
    
    // Update count
    const count = dashboardState.currentExtraction.outputFiles.length;
    document.getElementById('outputCount').textContent = `${count} files`;
    
    // Add to tree
    const container = document.getElementById('outputTree');
    const row = createTreeRow(fileInfo.name, fileInfo.ext, 0);
    row.classList.add('new-file');
    container.appendChild(row);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// ============================================
// Progress Updates (called from Python)
// ============================================

function updateProgress(current, total) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressCount').textContent = `${current} / ${total} files`;
}

function updateCurrentFile(filename) {
    document.getElementById('progressStatus').textContent = filename;
}

function showComplete(results) {
    // Update results
    document.getElementById('resultProcessed').textContent = results.processed || 0;
    document.getElementById('resultExtracted').textContent = results.extracted || 0;
    
    // Show warnings if any
    const warningsCard = document.getElementById('resultWarningsCard');
    const warningsNum = document.getElementById('resultWarnings');
    if (results.warnings > 0) {
        warningsCard.style.display = 'flex';
        warningsNum.textContent = results.warnings;
    } else {
        warningsCard.style.display = 'none';
    }
    
    // Show errors if any
    const errorsCard = document.getElementById('resultErrorsCard');
    const errorsNum = document.getElementById('resultErrors');
    if (results.errors > 0) {
        errorsCard.style.display = 'flex';
        errorsNum.textContent = results.errors;
    } else {
        errorsCard.style.display = 'none';
    }
    
    showSlide('complete');
}

function showCancelled() {
    // Go back to dashboard
    loadHistory(); // Refresh history
    showSlide('dashboard');
}

function showError(message) {
    console.error('Extraction error:', message);
    // Go back to dashboard
    loadHistory();
    showSlide('dashboard');
}

// ============================================
// Dashboard Button Handlers
// ============================================

function initDashboardButtons() {
    // New Extraction button (on dashboard)
    const btnNewExtraction = document.getElementById('btnNewExtraction');
    if (btnNewExtraction) {
        btnNewExtraction.addEventListener('click', startNewExtraction);
    }
    
    // Cancel button (on extraction view)
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', async () => {
            if (window.pywebview && !btnCancel.disabled) {
                // Disable button to prevent multiple clicks
                btnCancel.disabled = true;
                btnCancel.textContent = 'Cancelling...';
                
                // Update status
                const progressStatus = document.getElementById('progressStatus');
                if (progressStatus) {
                    progressStatus.textContent = 'Cancelling extraction...';
                }
                
                try {
                    await window.pywebview.api.cancel_extraction();
                } catch (e) {
                    console.error('Cancel failed:', e);
                    // Re-enable button if cancel fails
                    btnCancel.disabled = false;
                    btnCancel.textContent = 'Cancel';
                }
            }
        });
    }
    
    // Back to Dashboard button (on complete view)
    const btnBackToDashboard = document.getElementById('btnBackToDashboard');
    if (btnBackToDashboard) {
        btnBackToDashboard.addEventListener('click', () => {
            loadHistory(); // Refresh history
            showSlide('dashboard');
        });
    }
    
    // Open Folder button (on complete view)
    const btnOpenFolder = document.getElementById('btnOpenFolder');
    if (btnOpenFolder) {
        btnOpenFolder.addEventListener('click', async () => {
            if (window.pywebview) {
                await window.pywebview.api.open_output_folder();
            }
        });
    }
}

function initExtractionOptions() {
    // Load preference from localStorage
    const savedPreference = localStorage.getItem('docprep_extract_images');
    if (savedPreference !== null) {
        dashboardState.extractImages = savedPreference === 'true';
    }
    
    // Set checkbox state
    const extractImagesCheckbox = document.getElementById('extractImages');
    if (extractImagesCheckbox) {
        extractImagesCheckbox.checked = dashboardState.extractImages;
        
        // Listen for changes
        extractImagesCheckbox.addEventListener('change', (e) => {
            dashboardState.extractImages = e.target.checked;
            localStorage.setItem('docprep_extract_images', e.target.checked);
        });
    }
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initDashboardButtons();
    initExtractionOptions();
});

// Expose functions for Python to call
window.addOutputFile = addOutputFile;
window.updateProgress = updateProgress;
window.updateCurrentFile = updateCurrentFile;
window.showComplete = showComplete;
window.showCancelled = showCancelled;
window.showError = showError;
window.loadHistory = loadHistory;


