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
    
    // Show/hide polka dots (only visible on welcome screen)
    const polkaDots = document.querySelector('.polka-dots');
    if (polkaDots) {
        if (slideName === 'welcome') {
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
// Polka Dot Background Generator
// ============================================

function createPolkaDots() {
    const container = document.createElement('div');
    container.className = 'polka-dots';
    
    // Check if dark mode is active (manual override or system preference)
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
        // Ring distribution - dots avoid center
        centerX: 50,
        centerY: 50,
        minRadius: 25,  // % from center - inner ring boundary
        maxRadius: 55,  // % from center - outer ring boundary
        padding: 10     // px padding between dots
    };
    
    const placedDots = []; // Track placed dots for collision detection
    
    // Check if a new dot overlaps with any existing dot
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
                return true; // Overlap detected
            }
        }
        return false;
    }
    
    let attempts = 0;
    const maxAttempts = 500; // Prevent infinite loop
    
    while (placedDots.length < config.count && attempts < maxAttempts) {
        attempts++;
        
        // Generate position in ring pattern
        const angle = Math.random() * Math.PI * 2;
        const radius = config.minRadius + Math.random() * (config.maxRadius - config.minRadius);
        const x = config.centerX + Math.cos(angle) * radius;
        const y = config.centerY + Math.sin(angle) * radius;
        
        const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
        
        // Check for overlap
        if (checkOverlap(x, y, size)) {
            continue; // Try again
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
    
    // Fade in after a short delay
    setTimeout(() => {
        container.classList.add('visible');
    }, 100);
    
    // Store container reference for theme updates
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
        
        // Extract existing position and size from inline styles
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
    
    // #region agent log
    const beforeDark = html.classList.contains('dark');
    const beforeLight = html.classList.contains('light');
    fetch('http://127.0.0.1:7242/ingest/c348000e-1d47-4188-9f9c-d3003a099e49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:437',message:'applyTheme called',data:{theme, beforeDark, beforeLight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Remove existing theme classes
    html.classList.remove('dark', 'light');
    
    // Apply new theme
    if (theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.add('light');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Update polka dots color when theme changes
    updatePolkaDotsColor(theme);
    
    // #region agent log
    const tutorialSlide = document.getElementById('slide-tutorial');
    const tutorialContent = tutorialSlide?.querySelector('.slide-content');
    const tutorialContentStyles = tutorialContent ? window.getComputedStyle(tutorialContent) : null;
    const slideStyles = tutorialSlide ? window.getComputedStyle(tutorialSlide) : null;
    fetch('http://127.0.0.1:7242/ingest/c348000e-1d47-4188-9f9c-d3003a099e49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:455',message:'applyTheme completed',data:{theme, afterDark:html.classList.contains('dark'), afterLight:html.classList.contains('light'), slideBackground:slideStyles?.backgroundColor, slideContentBackground:tutorialContentStyles?.backgroundColor, bgPrimaryVar:getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
}

function initThemeToggle() {
    const toggleButton = document.getElementById('themeToggle');
    if (!toggleButton) return;
    
    // Get initial theme: saved preference or system preference
    const savedTheme = getSavedTheme();
    const initialTheme = savedTheme || getSystemTheme();
    
    // Apply initial theme
    applyTheme(initialTheme);
    
    // Set up click handler
    toggleButton.addEventListener('click', () => {
        const currentTheme = getSavedTheme() || getSystemTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // #region agent log
        const tutorialSlide = document.getElementById('slide-tutorial');
        const tutorialContent = tutorialSlide?.querySelector('.slide-content');
        const tutorialContentStyles = tutorialContent ? window.getComputedStyle(tutorialContent) : null;
        const slideStyles = tutorialSlide ? window.getComputedStyle(tutorialSlide) : null;
        const bodyStyles = window.getComputedStyle(document.body);
        fetch('http://127.0.0.1:7242/ingest/c348000e-1d47-4188-9f9c-d3003a099e49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:468',message:'theme toggle clicked',data:{currentTheme, newTheme, tutorialSlideActive:tutorialSlide?.classList.contains('active'), slideBackground:slideStyles?.backgroundColor, slideContentBackground:tutorialContentStyles?.backgroundColor, bodyBackground:bodyStyles.backgroundColor, bgPrimaryVar:getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        applyTheme(newTheme);
        
        // #region agent log
        setTimeout(() => {
            const tutorialSlideAfter = document.getElementById('slide-tutorial');
            const tutorialContentAfter = tutorialSlideAfter?.querySelector('.slide-content');
            const tutorialContentStylesAfter = tutorialContentAfter ? window.getComputedStyle(tutorialContentAfter) : null;
            const slideStylesAfter = tutorialSlideAfter ? window.getComputedStyle(tutorialSlideAfter) : null;
            const bodyStylesAfter = window.getComputedStyle(document.body);
            fetch('http://127.0.0.1:7242/ingest/c348000e-1d47-4188-9f9c-d3003a099e49',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:478',message:'theme toggle completed',data:{newTheme, tutorialSlideActive:tutorialSlideAfter?.classList.contains('active'), slideBackground:slideStylesAfter?.backgroundColor, slideContentBackground:tutorialContentStylesAfter?.backgroundColor, bodyBackground:bodyStylesAfter.backgroundColor, bgPrimaryVar:getComputedStyle(document.documentElement).getPropertyValue('--bg-primary'), htmlHasDark:document.documentElement.classList.contains('dark')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }, 100);
        // #endregion
    });
    
    // Listen for system theme changes (only if no manual override exists)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only update if user hasn't manually set a preference
        if (!getSavedTheme()) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    createPolkaDots();
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

