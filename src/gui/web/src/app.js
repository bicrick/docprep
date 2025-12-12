/**
 * DocPrep - Application Logic
 * Handles slide navigation, state management, and Python bridge communication
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
    extractPptxImages: false,
    libreOfficeAvailable: false
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
    
    // Show/hide polka dots (visible on welcome and complete screens)
    const polkaDots = document.querySelector('.polka-dots');
    if (polkaDots) {
        if (slideName === 'welcome' || slideName === 'complete') {
            polkaDots.classList.add('visible');
        } else {
            polkaDots.classList.remove('visible');
        }
    }
    
    state.currentSlide = slideName;
}

// ============================================
// Drop Zone Handling
// ============================================

function initDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
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
            if (window.pywebview) {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
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
    
    // Update PPTX toggle visibility after slide transition
    setTimeout(() => {
        updatePptxImagesToggleVisibility();
    }, 150);
}

// ============================================
// Button Handlers
// ============================================

function initButtons() {
    // Get Started button -> go to intro
    document.getElementById('btnGetStarted')?.addEventListener('click', () => {
        showSlide('intro');
    });
    
    // Continue button (from intro slide) -> go to tutorial
    document.getElementById('btnContinue')?.addEventListener('click', () => {
        showSlide('tutorial');
    });
    
    // Back to welcome button (from intro slide)
    document.getElementById('btnBackToWelcomeFromIntro')?.addEventListener('click', () => {
        showSlide('welcome');
    });
    
    // Continue button (from tutorial slide) -> go to drop
    document.getElementById('btnContinueToUpload')?.addEventListener('click', () => {
        showSlide('drop');
    });
    
    // Back to intro button (from tutorial slide)
    document.getElementById('btnBackToIntro')?.addEventListener('click', () => {
        showSlide('intro');
    });
    
    // Back to tutorial button (from drop slide)
    document.getElementById('btnBackToWelcome')?.addEventListener('click', () => {
        showSlide('tutorial');
    });
    
    // Back button (from ready slide)
    document.getElementById('btnBack')?.addEventListener('click', () => {
        showSlide('drop');
    });
    
    // Start button
    document.getElementById('btnStart')?.addEventListener('click', async () => {
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
    
    // Skip button
    document.getElementById('btnSkip')?.addEventListener('click', async () => {
        if (window.pywebview) {
            await window.pywebview.api.skip_extraction();
        }
    });
    
    // Cancel button
    document.getElementById('btnCancel')?.addEventListener('click', async () => {
        if (window.pywebview) {
            await window.pywebview.api.cancel_extraction();
        }
        state.isExtracting = false;
        showSlide('welcome');
    });
    
    // New extraction button
    document.getElementById('btnNewExtraction')?.addEventListener('click', () => {
        resetState();
        showSlide('drop');
    });
    
    // Open folder button
    document.getElementById('btnOpenFolder')?.addEventListener('click', async () => {
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
    
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressCount = document.getElementById('progressCount');
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressCount) progressCount.textContent = `${current} / ${total} files`;
}

function updateCurrentFile(filename) {
    const currentFileName = document.getElementById('currentFileName');
    if (currentFileName) currentFileName.textContent = filename;
    
    // Clear substep when starting a new file
    const substep = document.getElementById('currentSubStep');
    if (substep) {
        substep.textContent = '';
        substep.classList.remove('typing');
    }
}

function updateSubStep(message) {
    const el = document.getElementById('currentSubStep');
    if (el) {
        el.classList.remove('typing');
        void el.offsetWidth; // Trigger reflow for animation restart
        el.textContent = message;
        el.classList.add('typing');
    }
}

function showComplete(results) {
    state.isExtracting = false;
    
    // Store results globally
    window.extractionResults = results;
    
    // Update stat cards
    const processedValue = document.getElementById('statProcessedValue');
    const extractedValue = document.getElementById('statExtractedValue');
    const succeededCard = document.getElementById('statSucceededCard');
    const succeededValue = document.getElementById('statSucceededValue');
    const warningsCard = document.getElementById('statWarningsCard');
    const warningsValue = document.getElementById('statWarningsValue');
    const failedCard = document.getElementById('statFailedCard');
    const failedValue = document.getElementById('statFailedValue');
    
    if (processedValue) processedValue.textContent = results.processed || 0;
    if (extractedValue) extractedValue.textContent = results.extracted || 0;
    
    // Show succeeded card if any
    const succeededCount = results.succeeded ? results.succeeded.length : 0;
    if (succeededCard) {
        if (succeededCount > 0) {
            succeededCard.style.display = 'flex';
            succeededValue.textContent = succeededCount;
        } else {
            succeededCard.style.display = 'none';
        }
    }
    
    // Show warnings card if any
    const warningsCount = results.warnings ? results.warnings.length : 0;
    if (warningsCard) {
        if (warningsCount > 0) {
            warningsCard.style.display = 'flex';
            warningsValue.textContent = warningsCount;
        } else {
            warningsCard.style.display = 'none';
        }
    }
    
    // Show failed card if any
    const failedCount = results.failed ? results.failed.length : 0;
    if (failedCard) {
        if (failedCount > 0) {
            failedCard.style.display = 'flex';
            failedValue.textContent = failedCount;
        } else {
            failedCard.style.display = 'none';
        }
    }
    
    // Initialize clickable stat cards
    initCompleteView();
    
    // Ensure summary view is shown (not detail)
    showCompleteSummary();
    
    showSlide('complete');
}

function initCompleteView() {
    // Clickable stat cards
    const succeededCard = document.getElementById('statSucceededCard');
    const warningsCard = document.getElementById('statWarningsCard');
    const failedCard = document.getElementById('statFailedCard');
    
    succeededCard?.addEventListener('click', () => showCompleteDetail('succeeded', 'Succeeded Files'));
    warningsCard?.addEventListener('click', () => showCompleteDetail('warnings', 'Files with Warnings'));
    failedCard?.addEventListener('click', () => showCompleteDetail('failed', 'Failed Files'));
    
    // Back buttons
    document.getElementById('btnBackToSummary')?.addEventListener('click', showCompleteSummary);
    document.getElementById('btnBackToSummary2')?.addEventListener('click', showCompleteSummary);
}

function showCompleteSummary() {
    const summary = document.getElementById('completeSummary');
    const detail = document.getElementById('completeDetail');
    if (summary) summary.style.display = 'flex';
    if (detail) detail.style.display = 'none';
    
    // Show polka dots on summary view
    const polkaDots = document.querySelector('.polka-dots');
    if (polkaDots) polkaDots.classList.add('visible');
}

function showCompleteDetail(category, title) {
    const summary = document.getElementById('completeSummary');
    const detail = document.getElementById('completeDetail');
    const titleEl = document.getElementById('detailTitle');
    
    if (summary) summary.style.display = 'none';
    if (detail) detail.style.display = 'flex';
    if (titleEl) titleEl.textContent = title;
    
    // Hide polka dots on detail view
    const polkaDots = document.querySelector('.polka-dots');
    if (polkaDots) polkaDots.classList.remove('visible');
    
    renderDetailList(category);
}

function renderDetailList(category) {
    const results = window.extractionResults;
    if (!results) return;
    
    const listContainer = document.getElementById('resultsList');
    if (!listContainer) return;
    
    let items = [];
    
    switch (category) {
        case 'succeeded':
            items = (results.succeeded || []).map(item => ({ ...item, status: 'succeeded' }));
            break;
        case 'warnings':
            items = (results.warnings || []).map(item => ({ ...item, status: 'warning' }));
            break;
        case 'failed':
            items = (results.failed || []).map(item => ({ ...item, status: 'failed' }));
            break;
    }
    
    if (items.length === 0) {
        listContainer.innerHTML = `<div class="results-empty">No files in this category</div>`;
        return;
    }
    
    listContainer.innerHTML = items.map(item => renderResultItem(item)).join('');
    
    // Add click handlers for expandable items
    listContainer.querySelectorAll('.result-item.expandable').forEach(el => {
        el.addEventListener('click', () => {
            el.classList.toggle('expanded');
        });
    });
}

function renderResultItem(item) {
    const hasDetails = (item.messages && item.messages.length > 0) || 
                       (item.errors && item.errors.length > 0);
    const expandableClass = hasDetails ? 'expandable' : '';
    
    let statusIcon = '';
    let statusClass = '';
    
    switch (item.status) {
        case 'succeeded':
            statusIcon = '<span class="status-icon status-success">&#10003;</span>';
            statusClass = 'result-item-success';
            break;
        case 'warning':
            statusIcon = '<span class="status-icon status-warning">!</span>';
            statusClass = 'result-item-warning';
            break;
        case 'failed':
            statusIcon = '<span class="status-icon status-error">&#10005;</span>';
            statusClass = 'result-item-error';
            break;
    }
    
    let detailsHtml = '';
    if (hasDetails) {
        const messages = item.messages || item.errors || [];
        detailsHtml = `
            <div class="result-item-details">
                ${messages.map(msg => `<p class="detail-message">${escapeHtml(msg)}</p>`).join('')}
            </div>
        `;
    }
    
    const outputInfo = item.output_count !== undefined ? 
        `<span class="result-item-outputs">${item.output_count} files</span>` : '';
    
    return `
        <div class="result-item ${statusClass} ${expandableClass}">
            <div class="result-item-header">
                ${statusIcon}
                <span class="result-item-name">${escapeHtml(item.file)}</span>
                ${outputInfo}
                ${hasDetails ? '<span class="expand-icon">&#9662;</span>' : ''}
            </div>
            ${detailsHtml}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showCancelled() {
    state.isExtracting = false;
    showSlide('drop');
}

function showError(message) {
    state.isExtracting = false;
    console.error('Extraction error:', message);
    showSlide('drop');
}

// ============================================
// Polka Dot Background Generator
// ============================================

function createPolkaDots() {
    const container = document.createElement('div');
    container.className = 'polka-dots';
    
    // Check if dark mode is active
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const currentTheme = savedTheme || systemTheme;
    const isDarkMode = currentTheme === 'dark';
    const dotColor = isDarkMode ? '255, 255, 255' : '30, 58, 90';
    
    const config = {
        count: 20,
        minSize: 60,
        maxSize: 400,
        minOpacity: 0.03,
        maxOpacity: 0.07,
        centerX: 50,
        centerY: 50,
        minRadius: 25,
        maxRadius: 55,
        padding: 10
    };
    
    const placedDots = [];
    
    function checkOverlap(x, y, size) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const newX = (x / 100) * viewportWidth;
        const newY = (y / 100) * viewportHeight;
        const newRadius = size / 2;
        
        for (const dot of placedDots) {
            const existingX = (dot.x / 100) * viewportWidth;
            const existingY = (dot.y / 100) * viewportHeight;
            const existingRadius = dot.size / 2;
            
            const distance = Math.sqrt(
                Math.pow(newX - existingX, 2) + Math.pow(newY - existingY, 2)
            );
            
            const minDistance = newRadius + existingRadius + config.padding;
            
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    let attempts = 0;
    const maxAttempts = 500;
    
    while (placedDots.length < config.count && attempts < maxAttempts) {
        attempts++;
        
        const angle = Math.random() * Math.PI * 2;
        const radius = config.minRadius + Math.random() * (config.maxRadius - config.minRadius);
        const x = config.centerX + Math.cos(angle) * radius;
        const y = config.centerY + Math.sin(angle) * radius;
        
        const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
        
        if (checkOverlap(x, y, size)) {
            continue;
        }
        
        const opacity = config.minOpacity + Math.random() * (config.maxOpacity - config.minOpacity);
        
        const dot = document.createElement('div');
        dot.className = 'polka-dot';
        
        dot.style.cssText = `
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: rgba(${dotColor}, ${opacity});
            transform: translate(-50%, -50%);
        `;
        
        container.appendChild(dot);
        placedDots.push({ x, y, size });
    }
    
    document.body.insertBefore(container, document.body.firstChild);
    
    setTimeout(() => {
        container.classList.add('visible');
    }, 100);
    
    container.setAttribute('data-theme', currentTheme);
}

function updatePolkaDotsColor(theme) {
    const container = document.querySelector('.polka-dots');
    if (!container) return;
    
    const isDarkMode = theme === 'dark';
    const dotColor = isDarkMode ? '255, 255, 255' : '30, 58, 90';
    const dots = container.querySelectorAll('.polka-dot');
    
    dots.forEach((dot) => {
        const currentStyle = dot.style.cssText;
        const opacityMatch = currentStyle.match(/rgba\([^)]+,\s*([\d.]+)\)/);
        const opacity = opacityMatch ? opacityMatch[1] : '0.05';
        
        const leftMatch = currentStyle.match(/left:\s*([^;]+)/);
        const topMatch = currentStyle.match(/top:\s*([^;]+)/);
        const widthMatch = currentStyle.match(/width:\s*([^;]+)/);
        const heightMatch = currentStyle.match(/height:\s*([^;]+)/);
        
        if (leftMatch && topMatch && widthMatch && heightMatch) {
            dot.style.cssText = `
                left: ${leftMatch[1]};
                top: ${topMatch[1]};
                width: ${widthMatch[1]};
                height: ${heightMatch[1]};
                background: rgba(${dotColor}, ${opacity});
                transform: translate(-50%, -50%);
            `;
        }
    });
    
    container.setAttribute('data-theme', theme);
}

// ============================================
// Theme Toggle
// ============================================

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme() {
    return localStorage.getItem('theme');
}

function applyTheme(theme) {
    const html = document.documentElement;
    
    html.classList.remove('dark', 'light');
    
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.add('light');
    }
    
    localStorage.setItem('theme', theme);
    updatePolkaDotsColor(theme);
}

function initThemeToggle() {
    const toggleButton = document.getElementById('themeToggle');
    if (!toggleButton) return;
    
    const savedTheme = getSavedTheme();
    const initialTheme = savedTheme || getSystemTheme();
    
    applyTheme(initialTheme);
    
    toggleButton.addEventListener('click', () => {
        const currentTheme = getSavedTheme() || getSystemTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!getSavedTheme()) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// ============================================
// Initialization
// ============================================

export async function initApp() {
    initThemeToggle();
    createPolkaDots();
    initDropZone();
    initButtons();
    
    // Check if LibreOffice is available for PPTX image extraction
    await checkLibreOfficeAvailable();
    
    // Hide footer initially (welcome screen)
    const footer = document.getElementById('appFooter');
    if (footer) {
        footer.classList.add('hidden');
    }
    
    // Show welcome slide first
    showSlide('welcome');
}

async function checkLibreOfficeAvailable() {
    if (window.pywebview) {
        try {
            state.libreOfficeAvailable = await window.pywebview.api.check_libreoffice_available();
        } catch (e) {
            console.warn('Failed to check LibreOffice availability:', e);
            state.libreOfficeAvailable = false;
        }
    }
    
    // Update UI based on availability
    updatePptxImagesToggleVisibility();
}

function updatePptxImagesToggleVisibility() {
    const optionsSection = document.getElementById('pptxOptionsSection');
    if (optionsSection) {
        optionsSection.style.display = state.libreOfficeAvailable ? 'block' : 'none';
    }
}

// Expose functions for Python to call
window.updateProgress = updateProgress;
window.updateCurrentFile = updateCurrentFile;
window.updateSubStep = updateSubStep;
window.showComplete = showComplete;
window.showCancelled = showCancelled;
window.showError = showError;

