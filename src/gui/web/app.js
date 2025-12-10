/**
 * DocPrep - Wizard UI Controller
 * Handles slide navigation and Python bridge communication
 */

// ============================================
// State Management
// ============================================

const state = {
    currentSlide: 'welcome',
    folderPath: null,
    folderName: null,
    fileCount: 0,
    isExtracting: false,
    extractPptxImages: false
};

// ============================================
// Slide Navigation
// ============================================

function showSlide(slideName) {
    const slides = document.querySelectorAll('.slide');
    const targetSlide = document.getElementById(`slide-${slideName}`);
    const footer = document.getElementById('appFooter');
    
    if (!targetSlide) return;
    
    // Mark current slide for exit animation
    slides.forEach(slide => {
        if (slide.classList.contains('active')) {
            slide.classList.remove('active');
            slide.classList.add('exit-left');
            
            // Remove exit class after animation
            setTimeout(() => {
                slide.classList.remove('exit-left');
            }, 500);
        }
    });
    
    // Show new slide
    setTimeout(() => {
        targetSlide.classList.add('active');
    }, 100);
    
    // Show/hide footer (hidden on welcome screen only)
    if (footer) {
        if (slideName === 'welcome') {
            footer.classList.add('hidden');
        } else {
            footer.classList.remove('hidden');
        }
    }
    
    state.currentSlide = slideName;
}

// ============================================
// Drop Zone Handling
// ============================================

function initDropZone() {
    const dropZone = document.getElementById('dropZone');
    
    // Click to browse
    dropZone.addEventListener('click', async () => {
        if (window.pywebview) {
            const result = await window.pywebview.api.select_folder();
            if (result) {
                handleFolderSelected(result);
            }
        }
    });
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        // Get dropped folder path
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
            // Note: In pywebview, we'll handle this differently
            // The actual folder path will be passed from Python
            if (window.pywebview) {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    // Try to get the folder path from the first item
                    const path = files[0].path;
                    if (path) {
                        const result = await window.pywebview.api.validate_folder(path);
                        if (result) {
                            handleFolderSelected(result);
                        }
                    }
                }
            }
        }
    });
}

async function handleFolderSelected(folderData) {
    state.folderPath = folderData.path;
    state.folderName = folderData.name;
    state.fileCount = folderData.file_count;
    
    // Update UI
    document.getElementById('folderName').textContent = folderData.name;
    document.getElementById('folderPath').textContent = folderData.path;
    document.getElementById('fileCount').textContent = folderData.file_count;
    
    // Transition to ready slide
    showSlide('ready');
}

// ============================================
// Button Handlers
// ============================================

function initButtons() {
    // Get Started button -> go to intro
    document.getElementById('btnGetStarted').addEventListener('click', () => {
        showSlide('intro');
    });
    
    // Continue button (from intro slide) -> go to tutorial
    document.getElementById('btnContinue').addEventListener('click', () => {
        showSlide('tutorial');
    });
    
    // Back to welcome button (from intro slide)
    document.getElementById('btnBackToWelcomeFromIntro').addEventListener('click', () => {
        showSlide('welcome');
    });
    
    // Continue button (from tutorial slide) -> go to drop
    document.getElementById('btnContinueToUpload').addEventListener('click', () => {
        showSlide('drop');
    });
    
    // Back to intro button (from tutorial slide)
    document.getElementById('btnBackToIntro').addEventListener('click', () => {
        showSlide('intro');
    });
    
    // Back to tutorial button (from drop slide)
    document.getElementById('btnBackToWelcome').addEventListener('click', () => {
        showSlide('tutorial');
    });
    
    // Back button (from ready slide)
    document.getElementById('btnBack').addEventListener('click', () => {
        showSlide('drop');
    });
    
    // Start button
    document.getElementById('btnStart').addEventListener('click', async () => {
        if (!state.folderPath || state.isExtracting) return;
        
        // Read toggle state
        const pptxToggle = document.getElementById('pptxImagesToggle');
        state.extractPptxImages = pptxToggle ? pptxToggle.checked : false;
        
        state.isExtracting = true;
        showSlide('progress');
        
        // Reset progress UI
        updateProgress(0, 1);
        document.getElementById('currentFileName').textContent = 'Starting...';
        
        // Start extraction via Python with options
        if (window.pywebview) {
            await window.pywebview.api.start_extraction(state.extractPptxImages);
        }
    });
    
    // Cancel button
    document.getElementById('btnCancel').addEventListener('click', async () => {
        if (window.pywebview) {
            await window.pywebview.api.cancel_extraction();
        }
        state.isExtracting = false;
        showSlide('welcome');
    });
    
    // New extraction button
    document.getElementById('btnNewExtraction').addEventListener('click', () => {
        resetState();
        showSlide('drop');
    });
    
    // Open folder button
    document.getElementById('btnOpenFolder').addEventListener('click', async () => {
        if (window.pywebview) {
            await window.pywebview.api.open_output_folder();
        }
    });
}

function resetState() {
    state.folderPath = null;
    state.folderName = null;
    state.fileCount = 0;
    state.isExtracting = false;
    state.extractPptxImages = false;
    
    // Reset toggle UI
    const pptxToggle = document.getElementById('pptxImagesToggle');
    if (pptxToggle) {
        pptxToggle.checked = false;
    }
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
    document.getElementById('currentFileName').textContent = filename;
}

function showComplete(results) {
    state.isExtracting = false;
    
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
    state.isExtracting = false;
    showSlide('drop');
}

function showError(message) {
    state.isExtracting = false;
    // For now, just go back to drop slide
    // Could add a modal or toast notification
    console.error('Extraction error:', message);
    showSlide('drop');
}


// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initDropZone();
    initButtons();
    
    // Hide footer initially (welcome screen)
    const footer = document.getElementById('appFooter');
    if (footer) {
        footer.classList.add('hidden');
    }
    
    // Show welcome slide first
    showSlide('welcome');
});

// Expose functions for Python to call
window.updateProgress = updateProgress;
window.updateCurrentFile = updateCurrentFile;
window.showComplete = showComplete;
window.showCancelled = showCancelled;
window.showError = showError;

