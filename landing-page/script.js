/**
 * DocPrep Landing Page - Smooth Scrolling and Interactions
 */

// ============================================
// Smooth Scroll Navigation
// ============================================

function initSmoothScroll() {
    const navOffset = 80; // Height of fixed navigation bar
    
    // Handle "Get Started" button
    const btnGetStarted = document.getElementById('btnGetStarted');
    if (btnGetStarted) {
        btnGetStarted.addEventListener('click', (e) => {
            e.preventDefault();
            const tutorialSection = document.getElementById('tutorial');
            if (tutorialSection) {
                const elementPosition = tutorialSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Handle any anchor links for smooth scrolling (including nav links)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Scroll Animations with Intersection Observer
// ============================================

function initScrollAnimations() {
    const sections = document.querySelectorAll('.landing-section:not(.section-footer)');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Show first section immediately
    if (sections.length > 0) {
        sections[0].classList.add('visible');
    }
    
    // Make footer visible immediately (not animated)
    const footer = document.querySelector('.section-footer');
    if (footer) {
        footer.classList.add('visible');
    }
}

// ============================================
// Scroll-Based Tree Animation
// ============================================

function initScrollBasedTreeAnimation() {
    const treeBefore = document.querySelector('.tree-before');
    const treeAfter = document.querySelector('.tree-after');
    const treeArrow = document.querySelector('.tree-arrow');
    const progressWheel = document.querySelector('.progress-wheel');
    const wheelFill = document.querySelector('.wheel-fill');
    const afterRows = document.querySelectorAll('.tree-after .finder-row');
    
    if (!treeBefore || !treeAfter || !treeArrow) return;
    
    function updateTreeAnimation() {
        const rect = treeBefore.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const padding = 100; // Padding before bottom enters
        
        // Start: when top of .tree-before enters viewport
        // End: before bottom of .tree-before enters viewport (with padding)
        const topEnterPoint = windowHeight; // Top enters when rect.top <= windowHeight
        const bottomEnterPoint = windowHeight - padding; // End animation before bottom enters
        
        // Check if we're below the element (element is above viewport or entering)
        const isBelowViewport = rect.top > windowHeight;
        
        if (isBelowViewport) {
            // Reset all animations when element is below viewport
            treeArrow.style.opacity = '0';
            treeAfter.style.opacity = '0';
            treeAfter.style.transform = 'translateX(20px)';
            
            if (progressWheel) progressWheel.style.opacity = '0';
            if (wheelFill) wheelFill.style.strokeDashoffset = '113.1'; // Reset fill
            
            afterRows.forEach(row => {
                row.style.opacity = '0';
                row.style.transform = 'translateY(5px)';
            });
        } else {
            // Fade-in progress: Starts when container enters viewport (rect.top <= windowHeight)
            const fadeStartTop = topEnterPoint;
            const endTop = bottomEnterPoint - rect.height;
            const fadeTotalRange = fadeStartTop - endTop;
            const fadeCurrentDistance = fadeStartTop - rect.top;
            const fadeProgress = Math.max(0, Math.min(1, fadeCurrentDistance / fadeTotalRange));
            
            // Fill progress: Starts when first row is about to pop (delayed)
            // Delay start to match row trigger: windowHeight - (windowHeight / 3)
            // Add extra offset for header/first row position: ~60px
            const triggerPadding = windowHeight / 3;
            const fillStartTop = windowHeight - triggerPadding - 60;
            
            // Finish when the bottom of the container reaches the trigger point (last row pops)
            // rect.bottom = windowHeight - triggerPadding
            // Since rect.top = rect.bottom - rect.height -> fillEndTop = (windowHeight - triggerPadding) - rect.height
            const fillEndTop = (windowHeight - triggerPadding) - rect.height;
            
            const fillTotalRange = fillStartTop - fillEndTop;
            const fillCurrentDistance = fillStartTop - rect.top;
            const fillProgress = Math.max(0, Math.min(1, fillCurrentDistance / fillTotalRange));
            
            // Fade in center elements (arrow and wheel) based on fadeProgress
            if (fadeProgress > 0) {
                // Fade in quickly
                const opacity = Math.min(1, fadeProgress / 0.2);
                treeArrow.style.opacity = opacity.toString();
                if (progressWheel) progressWheel.style.opacity = opacity.toString();
                
                // Animate wheel fill based on fillProgress
                if (wheelFill) {
                    // Full circumference is ~113.1
                    const circumference = 113.1;
                    // Use fillProgress for the filling animation
                    const offset = circumference * (1 - fillProgress);
                    wheelFill.style.strokeDashoffset = offset.toString();
                }
            } else {
                treeArrow.style.opacity = '0';
                if (progressWheel) progressWheel.style.opacity = '0';
            }
            
            // Animate tree panel sliding in (0.1-0.4 of progress) - faster
            if (fadeProgress > 0.1) {
                const treeProgress = Math.min(1, (fadeProgress - 0.1) / 0.3);
                const opacity = treeProgress;
                const translateX = 20 * (1 - treeProgress);
                treeAfter.style.opacity = opacity.toString();
                treeAfter.style.transform = `translateX(${translateX}px)`;
            } else {
                treeAfter.style.opacity = '0';
                treeAfter.style.transform = 'translateX(20px)';
            }
            
            // Animate individual rows based on their OWN visibility
            afterRows.forEach((row) => {
                const rowRect = row.getBoundingClientRect();
                // Trigger when row is well inside viewport (1/3 of screen height buffer)
                // This delays the pop until the user has clearly scrolled to it, creating a "processing" feel
                const isVisible = rowRect.top < windowHeight - (windowHeight / 3);
                
                if (isVisible) {
                    // Pop-in effect: instant appearance when triggered
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0px)';
                } else {
                    row.style.opacity = '0';
                    row.style.transform = 'translateY(5px)';
                }
            });
        }
    }
    
    // Use requestAnimationFrame for smooth updates
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateTreeAnimation();
                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    updateTreeAnimation(); // Initial call
}

// ============================================
// Download Button Handlers
// ============================================

function initDownloadButtons() {
    const downloadMac = document.getElementById('download-mac');
    const downloadWindows = document.getElementById('download-windows');
    
    if (downloadMac) {
        downloadMac.addEventListener('click', (e) => {
            e.preventDefault();
            // Placeholder - will be replaced with actual download link
            console.log('Mac download clicked - placeholder');
            // TODO: Replace with actual download URL when available
            // window.location.href = 'path/to/docprep.dmg';
        });
    }
    
    if (downloadWindows) {
        downloadWindows.addEventListener('click', (e) => {
            e.preventDefault();
            // Placeholder - will be replaced with actual download link
            console.log('Windows download clicked - placeholder');
            // TODO: Replace with actual download URL when available
            // window.location.href = 'path/to/docprep.exe';
        });
    }
}

// ============================================
// Active Navigation Link on Scroll
// ============================================

function initActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.landing-section');
    const navOffset = 100; // Offset for active state detection
    
    function updateActiveLink() {
        const scrollPosition = window.scrollY + navOffset;
        
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
        
        // Handle top of page
        if (scrollPosition < sections[0].offsetTop) {
            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[href="#hero"]');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        }
    }
    
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Initial call
}

// ============================================
// Polka Dot Background Generator
// ============================================

function createPolkaDots() {
    const container = document.createElement('div');
    container.className = 'polka-dots';
    
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
            background: rgba(255, 255, 255, ${opacity});
            transform: translate(-50%, -50%);
        `;
        
        container.appendChild(dot);
        placedDots.push({ x, y, size });
    }
    
    document.body.insertBefore(container, document.body.firstChild);
}

// ============================================
// Initialize on DOM Load
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    createPolkaDots();
    initSmoothScroll();
    initScrollAnimations();
    initDownloadButtons();
    initActiveNavLink();
    initScrollBasedTreeAnimation();
});
