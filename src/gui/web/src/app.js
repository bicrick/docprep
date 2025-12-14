/**
 * DocPrep - Application Logic
 * Handles slide navigation, state management, and Python bridge communication
 */

import { showUpdateNotice, hideUpdateNotice } from './components/UpdateNotice.js';
import {
    initFirebase,
    getCurrentUser,
    isSignedIn,
    signInWithGoogle,
    signInWithGoogleCredential,
    signInWithEmail,
    createAccountWithEmail,
    sendPasswordReset,
    signOut,
    onAuthStateChanged,
    getUserDisplayInfo,
    getAuthErrorMessage,
    fetchSignInMethodsForEmail
} from './auth/firebase.js';

// ============================================
// State Management
// ============================================

const state = {
    currentSlide: 'welcome',
    folderPath: null,
    folderName: null,
    parentPath: null,
    siblingNames: [],
    fileCount: 0,
    isExtracting: false,
    extractPptxImages: false,
    libreOfficeAvailable: false,
    outputFolderName: '',
    outputFolderPath: '',  // Full path to output folder
    outputNameValid: true,
    outputNameError: '',
    // Auth state
    user: null,
    isAuthLoading: false,
    pendingEmail: null,  // Email to pre-fill in onboarding
    // Editor preference
    selectedEditor: localStorage.getItem('docprep_selected_editor') || 'cursor'
};

// ============================================
// Slide Navigation
// ============================================

function showSlide(slideName) {
    const slides = document.querySelectorAll('.slide');
    const targetSlide = document.getElementById(`slide-${slideName}`);
    const footer = document.getElementById('appFooter');
    
    if (!targetSlide) return;
    
    // Close any open modals
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    
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
    
    // Show/hide polka dots (visible on welcome, signin, onboarding, and complete screens)
    const polkaDots = document.querySelector('.polka-dots');
    if (polkaDots) {
        if (slideName === 'welcome' || slideName === 'signin' || slideName === 'onboarding' || slideName === 'complete') {
            polkaDots.classList.add('visible');
        } else {
            polkaDots.classList.remove('visible');
        }
    }
    
    // Show/hide update notice (only visible on welcome screen)
    if (slideName === 'welcome') {
        showUpdateNotice();
    } else {
        hideUpdateNotice();
    }
    
    // Reset sign-in form when navigating to signin slide
    if (slideName === 'signin') {
        resetSignInForm();
    }
    
    // Pre-fill email when navigating to onboarding
    if (slideName === 'onboarding') {
        prefillOnboardingEmail();
    }
    
    state.currentSlide = slideName;
    
    // Update user avatar visibility
    updateUserAvatarVisibility();
    
    // Hide back button on drop zone if user is signed in (no need to go back)
    const dropBackBtn = document.getElementById('btnBackToWelcome');
    if (dropBackBtn) {
        if (slideName === 'drop' && state.user) {
            dropBackBtn.style.display = 'none';
        } else {
            dropBackBtn.style.display = '';
        }
    }
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
    state.parentPath = folderData.parent_path;
    state.siblingNames = folderData.sibling_names || [];
    state.fileCount = folderData.file_count;
    
    // Set default output folder name and full path
    // Replace spaces with underscores to avoid path issues with editors
    const sanitizedName = folderData.name.replace(/ /g, '_');
    const defaultOutputName = sanitizedName + '_extracted';
    state.outputFolderName = defaultOutputName;
    const separator = state.parentPath.includes('\\') ? '\\' : '/';
    state.outputFolderPath = state.parentPath + separator + defaultOutputName;
    state.outputNameValid = true;
    state.outputNameError = '';
    
    // Update UI
    document.getElementById('folderName').textContent = folderData.name;
    document.getElementById('folderPath').textContent = folderData.path;
    document.getElementById('fileCount').textContent = folderData.file_count;
    
    // Transition to ready slide
    showSlide('ready');
    
    // Update output name input and PPTX toggle visibility after slide transition
    setTimeout(() => {
        updatePptxImagesToggleVisibility();
        initOutputNameInput();
    }, 150);
}

function initOutputNameInput() {
    const input = document.getElementById('outputFolderName');
    
    if (!input) return;
    
    // Set initial value
    input.value = state.outputFolderName;
    updateOutputPathPreview();
    
    // Remove any existing listeners by cloning
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    // Add input handler to new element
    newInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        state.outputFolderName = value;
        validateOutputName();
        updateOutputPathPreview();
        updateStartButtonState();
    });
    
    // Initialize browse button
    initBrowseButton();
    
    // Initialize change source button
    initChangeSourceButton();
    
    // Initialize settings panel toggle
    initSettingsPanel();
}

function initSettingsPanel() {
    const toggleBtn = document.getElementById('btnSettingsToggle');
    const panel = document.getElementById('settingsPanel');
    
    if (!toggleBtn || !panel) return;
    
    // Remove existing listeners by cloning
    const newBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
    
    newBtn.addEventListener('click', () => {
        const isExpanded = newBtn.getAttribute('aria-expanded') === 'true';
        newBtn.setAttribute('aria-expanded', !isExpanded);
        panel.classList.toggle('open', !isExpanded);
    });
}

function initBrowseButton() {
    const browseBtn = document.getElementById('btnBrowseOutput');
    if (!browseBtn) return;
    
    // Remove existing listeners by cloning
    const newBtn = browseBtn.cloneNode(true);
    browseBtn.parentNode.replaceChild(newBtn, browseBtn);
    
    newBtn.addEventListener('click', async () => {
        if (window.pywebview) {
            const result = await window.pywebview.api.browse_output_folder();
            if (result) {
                // The selected folder becomes the parent where output will be created
                // Keep the current folder name - user can continue editing it
                state.parentPath = result.parent_path;
                state.siblingNames = result.children_names || [];
                
                // Validate and update UI (path preview will update with new parent)
                validateOutputName();
                updateOutputPathPreview();
                updateStartButtonState();
            }
        }
    });
}

function initChangeSourceButton() {
    const changeBtn = document.getElementById('btnChangeSource');
    if (!changeBtn) return;
    
    // Remove existing listeners by cloning
    const newBtn = changeBtn.cloneNode(true);
    changeBtn.parentNode.replaceChild(newBtn, changeBtn);
    
    newBtn.addEventListener('click', async () => {
        if (window.pywebview) {
            const result = await window.pywebview.api.select_folder();
            if (result) {
                // Re-use the existing folder selection handler
                handleFolderSelected(result);
            }
        }
    });
}

function validateOutputName() {
    const name = state.outputFolderName;
    const input = document.getElementById('outputFolderName');
    const errorEl = document.getElementById('outputNameError');
    
    // Reset state
    state.outputNameValid = true;
    state.outputNameError = '';
    
    // Check if empty
    if (!name || name.length === 0) {
        state.outputNameValid = false;
        state.outputNameError = 'Please enter a folder name';
    }
    // Check for invalid characters
    else if (/[<>:"/\\|?*]/.test(name)) {
        state.outputNameValid = false;
        state.outputNameError = 'Name contains invalid characters';
    }
    // Check if same as original folder
    else if (name === state.folderName) {
        state.outputNameValid = false;
        state.outputNameError = 'Cannot use the same name as the source folder';
    }
    // Check if folder already exists in parent directory
    else if (state.siblingNames.includes(name)) {
        state.outputNameValid = false;
        state.outputNameError = 'A folder with this name already exists';
    }
    
    // Update UI - apply error class to parent container
    if (input) {
        const container = input.closest('.folder-box');
        if (container) {
            container.classList.toggle('error', !state.outputNameValid);
        }
    }
    if (errorEl) {
        errorEl.textContent = state.outputNameError;
    }
    
    return state.outputNameValid;
}

function updateOutputPathPreview() {
    const pathPreview = document.getElementById('outputFolderPath');
    if (pathPreview && state.parentPath) {
        const separator = state.parentPath.includes('\\') ? '\\' : '/';
        const outputPath = state.parentPath + separator + (state.outputFolderName || '...');
        state.outputFolderPath = outputPath;
        pathPreview.textContent = outputPath;
    }
}

function updateStartButtonState() {
    const startBtn = document.getElementById('btnStart');
    if (startBtn) {
        startBtn.disabled = !state.outputNameValid || !state.outputFolderName;
    }
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
    
    // Continue button (from tutorial slide) -> go to signin (changed from drop)
    document.getElementById('btnContinueToUpload')?.addEventListener('click', () => {
        // If already signed in, skip to drop zone
        if (isSignedIn()) {
            showSlide('drop');
        } else {
            showSlide('signin');
        }
    });
    
    // Back to intro button (from tutorial slide)
    document.getElementById('btnBackToIntro')?.addEventListener('click', () => {
        showSlide('intro');
    });
    
    // Back to tutorial button (from signin slide)
    document.getElementById('btnBackToTutorial')?.addEventListener('click', () => {
        showSlide('tutorial');
    });
    
    // Back to signin button (from drop slide) - now goes back to signin
    document.getElementById('btnBackToWelcome')?.addEventListener('click', () => {
        showSlide('signin');
    });
    
    // Back button (from ready slide)
    document.getElementById('btnBack')?.addEventListener('click', () => {
        showSlide('drop');
    });
    
    // Start button
    document.getElementById('btnStart')?.addEventListener('click', async () => {
        if (!state.folderPath || state.isExtracting) return;
        
        // Validate output name one more time
        if (!validateOutputName()) return;
        
        // Read toggle state
        const pptxToggle = document.getElementById('pptxImagesToggle');
        state.extractPptxImages = pptxToggle ? pptxToggle.checked : false;
        
        state.isExtracting = true;
        showSlide('progress');
        
        // Reset progress UI
        updateProgress(0, 1);
        document.getElementById('currentFileName').textContent = 'Starting...';
        
        // Start extraction via Python with options and custom output path
        if (window.pywebview) {
            await window.pywebview.api.start_extraction(state.extractPptxImages, state.outputFolderPath);
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
    state.parentPath = null;
    state.siblingNames = [];
    state.fileCount = 0;
    state.isExtracting = false;
    state.extractPptxImages = false;
    state.outputFolderName = '';
    state.outputFolderPath = '';
    state.outputNameValid = true;
    state.outputNameError = '';
    
    // Reset toggle UI
    const pptxToggle = document.getElementById('pptxImagesToggle');
    if (pptxToggle) {
        pptxToggle.checked = false;
    }
}

// ============================================
// Authentication
// ============================================

function initAuth() {
    // Initialize Firebase
    const firebaseReady = initFirebase();
    if (!firebaseReady) {
        console.warn('Firebase not initialized - auth features will be disabled');
        return Promise.resolve(null);
    }
    
    // Return a promise that resolves with the initial auth state
    return new Promise((resolve) => {
        let initialAuthResolved = false;
        
        onAuthStateChanged((user) => {
            console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
            console.log('Current slide:', state.currentSlide);
            
            state.user = user;
            updateAuthUI(user);
            
            // Resolve the promise on first auth state (initial load)
            if (!initialAuthResolved) {
                initialAuthResolved = true;
                console.log('Initial auth resolved:', user ? 'signed in' : 'not signed in');
                resolve(user);
            } else {
                // Subsequent auth changes (sign in/out during session)
                const preSignInSlides = ['welcome', 'intro', 'tutorial', 'signin', 'email-signin', 'onboarding'];
                
                console.log('Checking navigation: user=', !!user, 'currentSlide=', state.currentSlide, 'inPreSignIn=', preSignInSlides.includes(state.currentSlide));
                
                if (user && preSignInSlides.includes(state.currentSlide)) {
                    console.log('Navigating to drop zone after auth');
                    showSlide('drop');
                }
            }
        });
    });
}

function initUserAvatarHandlers() {
    // Initialize avatar handlers (called after initial slide is shown)
    initUserAvatar();
}

function initSignInForm() {
    const googleBtn = document.getElementById('btnSignInGoogle');
    
    // Sign up link click handler
    document.getElementById('btnGoToSignUp')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide('onboarding');
    });
    
    // Email sign in button - navigate to email signin slide
    document.getElementById('btnOpenEmailModal')?.addEventListener('click', () => {
        showSlide('email-signin');
    });
    
    // Google sign in
    googleBtn?.addEventListener('click', async () => {
        setSignInLoading(true, 'google');
        clearSignInError();
        
        // Check if running in pywebview (desktop app)
        if (window.pywebview) {
            try {
                // Use desktop OAuth flow via Python backend
                showSignInStatus('Opening browser for Google sign-in...');
                await window.pywebview.api.start_google_signin();
                // Result will come via googleSignInSuccess/googleSignInError callbacks
            } catch (error) {
                clearSignInStatus();
                showSignInError('Failed to start Google sign-in');
                setSignInLoading(false);
            }
        } else {
            // Web fallback - use popup
            try {
                await signInWithGoogle();
                // Success - auth state listener will handle navigation
            } catch (error) {
                if (error.code !== 'auth/popup-closed-by-user') {
                    showSignInError(getAuthErrorMessage(error));
                }
            } finally {
                setSignInLoading(false);
            }
        }
    });
}

function initEmailSignInForm() {
    const form = document.getElementById('emailSigninForm');
    const emailInput = document.getElementById('emailSigninEmail');
    const passwordInput = document.getElementById('emailSigninPassword');
    const forgotBtn = document.getElementById('emailForgotPasswordBtn');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput?.value?.trim();
        const password = passwordInput?.value;
        
        if (!email) {
            showEmailSignInError('Please enter your email address');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showEmailSignInError('Please enter a valid email address');
            return;
        }
        
        if (!password) {
            showEmailSignInError('Please enter your password');
            return;
        }
        
        setEmailSignInLoading(true);
        clearEmailSignInError();
        
        try {
            await signInWithEmail(email, password);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                showEmailSignInError('No account found with this email.');
            } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                showEmailSignInError('Incorrect email or password.');
            } else {
                showEmailSignInError(getAuthErrorMessage(error));
            }
        } finally {
            setEmailSignInLoading(false);
        }
    });
    
    // Sign up link
    document.getElementById('btnGoToSignUpFromEmail')?.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput?.value?.trim();
        if (email) state.pendingEmail = email;
        showSlide('onboarding');
    });
    
    // Back button
    document.getElementById('btnBackToSignIn')?.addEventListener('click', () => showSlide('signin'));
    
    // Forgot password
    forgotBtn?.addEventListener('click', async () => {
        const email = emailInput?.value?.trim();
        if (!email) {
            showEmailSignInError('Please enter your email address first');
            emailInput?.focus();
            return;
        }
        setEmailSignInLoading(true);
        try {
            await sendPasswordReset(email);
            showEmailSignInError('Password reset email sent. Check your inbox.');
        } catch (error) {
            showEmailSignInError(getAuthErrorMessage(error));
        } finally {
            setEmailSignInLoading(false);
        }
    });
    
    emailInput?.addEventListener('input', clearEmailSignInError);
    passwordInput?.addEventListener('input', clearEmailSignInError);
}

function showEmailSignInError(message) {
    const el = document.getElementById('emailSigninError');
    if (el) el.textContent = message;
}

function clearEmailSignInError() {
    const el = document.getElementById('emailSigninError');
    if (el) el.textContent = '';
}

function setEmailSignInLoading(loading) {
    const btn = document.getElementById('btnEmailSignIn');
    if (btn) {
        btn.disabled = loading;
        btn.classList.toggle('loading', loading);
    }
}

function showSignInError(message) {
    const errorEl = document.getElementById('signinError');
    if (errorEl) {
        errorEl.textContent = message;
    }
    // Hide status when showing error
    clearSignInStatus();
}

function clearSignInError() {
    const errorEl = document.getElementById('signinError');
    if (errorEl) {
        errorEl.textContent = '';
    }
}

function showSignInStatus(message) {
    const statusEl = document.getElementById('signinStatus');
    const textEl = statusEl?.querySelector('.status-text');
    if (statusEl && textEl) {
        textEl.textContent = message;
        statusEl.classList.add('visible');
    }
    // Hide error when showing status
    clearSignInError();
}

function clearSignInStatus() {
    const statusEl = document.getElementById('signinStatus');
    if (statusEl) {
        statusEl.classList.remove('visible');
    }
}

function setSignInLoading(loading, type = 'email') {
    state.isAuthLoading = loading;
    
    const emailBtn = document.getElementById('btnSignInEmail');
    const googleBtn = document.getElementById('btnSignInGoogle');
    const emailInput = document.getElementById('signinEmail');
    const passwordInput = document.getElementById('signinPassword');
    
    if (loading) {
        emailBtn?.classList.add('loading');
        emailBtn?.setAttribute('disabled', 'true');
        googleBtn?.setAttribute('disabled', 'true');
        emailInput?.setAttribute('disabled', 'true');
        passwordInput?.setAttribute('disabled', 'true');
    } else {
        emailBtn?.classList.remove('loading');
        emailBtn?.removeAttribute('disabled');
        googleBtn?.removeAttribute('disabled');
        emailInput?.removeAttribute('disabled');
        passwordInput?.removeAttribute('disabled');
    }
}

function updateAuthUI(user) {
    // Update user avatar with user info
    const avatarPhoto = document.getElementById('userAvatarPhoto');
    const avatarInitial = document.getElementById('userAvatarInitial');
    const dropdownName = document.getElementById('userDropdownName');
    const dropdownEmail = document.getElementById('userDropdownEmail');
    
    if (user) {
        console.log('User signed in:', user.email);
        const userInfo = getUserDisplayInfo(user);
        
        // Update avatar photo or initial
        if (userInfo.photoURL && avatarPhoto) {
            avatarPhoto.style.backgroundImage = `url(${userInfo.photoURL})`;
            avatarPhoto.classList.add('visible');
            if (avatarInitial) avatarInitial.classList.add('hidden');
        } else if (avatarInitial) {
            const initial = userInfo.displayName ? userInfo.displayName.charAt(0) : 'U';
            avatarInitial.textContent = initial;
            avatarInitial.classList.remove('hidden');
            if (avatarPhoto) avatarPhoto.classList.remove('visible');
        }
        
        // Update dropdown info
        if (dropdownName) dropdownName.textContent = userInfo.displayName || 'User';
        if (dropdownEmail) dropdownEmail.textContent = userInfo.email || '';
    } else {
        console.log('User signed out');
        
        // Clear avatar
        if (avatarPhoto) {
            avatarPhoto.style.backgroundImage = '';
            avatarPhoto.classList.remove('visible');
        }
        if (avatarInitial) {
            avatarInitial.textContent = '';
            avatarInitial.classList.remove('hidden');
        }
        if (dropdownName) dropdownName.textContent = '';
        if (dropdownEmail) dropdownEmail.textContent = '';
    }
    
    // Update avatar visibility based on current slide
    updateUserAvatarVisibility();
}

function resetSignInForm() {
    const emailInput = document.getElementById('signinEmail');
    const passwordInput = document.getElementById('signinPassword');
    const errorEl = document.getElementById('signinError');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorEl) errorEl.textContent = '';
}

// ============================================
// Onboarding Form
// ============================================

function initOnboardingForm() {
    const form = document.getElementById('onboardingForm');
    const nameInput = document.getElementById('onboardingName');
    const emailInput = document.getElementById('onboardingEmail');
    const passwordInput = document.getElementById('onboardingPassword');
    const confirmInput = document.getElementById('onboardingPasswordConfirm');
    const backBtn = document.getElementById('btnBackToSignIn');
    const googleBtn = document.getElementById('btnSignUpGoogle');
    
    if (!form) return;
    
    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = nameInput?.value?.trim();
        const email = emailInput?.value?.trim();
        const password = passwordInput?.value;
        const confirmPassword = confirmInput?.value;
        
        // Validation
        if (!name) {
            showOnboardingError('Please enter your full name');
            nameInput?.focus();
            return;
        }
        
        if (!email) {
            showOnboardingError('Please enter your email');
            return;
        }
        
        if (!password) {
            showOnboardingError('Please create a password');
            passwordInput?.focus();
            return;
        }
        
        if (password.length < 6) {
            showOnboardingError('Password must be at least 6 characters');
            passwordInput?.focus();
            return;
        }
        
        if (password !== confirmPassword) {
            showOnboardingError('Passwords do not match');
            confirmInput?.focus();
            return;
        }
        
        // Create account
        setOnboardingLoading(true);
        clearOnboardingError();
        
        console.log('Creating account for:', email);
        
        try {
            const user = await createAccountWithEmail(email, password);
            console.log('Account created successfully:', user?.email);
            
            // Update display name after account creation
            if (user && name) {
                try {
                    await user.updateProfile({ displayName: name });
                    console.log('Display name updated to:', name);
                } catch (profileError) {
                    console.warn('Could not update display name:', profileError);
                }
            }
            
            // Success - auth state listener will handle navigation
            console.log('Account creation complete, waiting for auth state change...');
        } catch (error) {
            console.error('Account creation failed:', error.code, error.message);
            if (error.code === 'auth/email-already-in-use') {
                // Check if this email is linked to Google
                try {
                    const signInMethods = await fetchSignInMethodsForEmail(email);
                    if (signInMethods.includes('google.com') && !signInMethods.includes('password')) {
                        showOnboardingError('This email is already linked to a Google account. Please use "Sign up with Google" below.');
                    } else {
                        showOnboardingError('An account with this email already exists. Please sign in instead.');
                    }
                } catch {
                    showOnboardingError('An account with this email already exists. Please sign in instead.');
                }
            } else if (error.code === 'auth/weak-password') {
                showOnboardingError('Password is too weak. Please use a stronger password.');
            } else if (error.code === 'auth/invalid-email') {
                showOnboardingError('Please enter a valid email address.');
            } else {
                showOnboardingError(getAuthErrorMessage(error));
            }
        } finally {
            setOnboardingLoading(false);
        }
    });
    
    // Google sign up
    googleBtn?.addEventListener('click', async () => {
        setOnboardingLoading(true);
        clearOnboardingError();
        
        // Check if running in pywebview (desktop app)
        if (window.pywebview) {
            try {
                // Use desktop OAuth flow via Python backend
                showOnboardingStatus('Opening browser for Google sign-up...');
                await window.pywebview.api.start_google_signin();
                // Result will come via googleSignInSuccess/googleSignInError callbacks
            } catch (error) {
                clearOnboardingStatus();
                showOnboardingError('Failed to start Google sign-up');
                setOnboardingLoading(false);
            }
        } else {
            // Web fallback - use popup
            try {
                await signInWithGoogle();
                // Success - auth state listener will handle navigation
            } catch (error) {
                if (error.code !== 'auth/popup-closed-by-user') {
                    showOnboardingError(getAuthErrorMessage(error));
                }
            } finally {
                setOnboardingLoading(false);
            }
        }
    });
    
    // Back to sign in
    backBtn?.addEventListener('click', () => {
        resetOnboardingForm();
        showSlide('signin');
    });
    
    // Terms and privacy links in onboarding
    document.getElementById('openTermsModalOnboarding')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('terms-modal-onboarding');
    });
    
    document.getElementById('openPrivacyModalOnboarding')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('privacy-modal-onboarding');
    });
}

function showOnboardingError(message) {
    const errorEl = document.getElementById('onboardingError');
    if (errorEl) {
        errorEl.textContent = message;
    }
    // Hide status when showing error
    clearOnboardingStatus();
}

function clearOnboardingError() {
    const errorEl = document.getElementById('onboardingError');
    if (errorEl) {
        errorEl.textContent = '';
    }
}

function showOnboardingStatus(message) {
    const statusEl = document.getElementById('onboardingStatus');
    const textEl = statusEl?.querySelector('.status-text');
    if (statusEl && textEl) {
        textEl.textContent = message;
        statusEl.classList.add('visible');
    }
    // Hide error when showing status
    clearOnboardingError();
}

function clearOnboardingStatus() {
    const statusEl = document.getElementById('onboardingStatus');
    if (statusEl) {
        statusEl.classList.remove('visible');
    }
}

function setOnboardingLoading(loading) {
    const submitBtn = document.getElementById('btnCreateAccount');
    const googleBtn = document.getElementById('btnSignUpGoogle');
    const nameInput = document.getElementById('onboardingName');
    const emailInput = document.getElementById('onboardingEmail');
    const passwordInput = document.getElementById('onboardingPassword');
    const confirmInput = document.getElementById('onboardingPasswordConfirm');
    
    if (loading) {
        submitBtn?.classList.add('loading');
        submitBtn?.setAttribute('disabled', 'true');
        googleBtn?.setAttribute('disabled', 'true');
        nameInput?.setAttribute('disabled', 'true');
        emailInput?.setAttribute('disabled', 'true');
        passwordInput?.setAttribute('disabled', 'true');
        confirmInput?.setAttribute('disabled', 'true');
    } else {
        submitBtn?.classList.remove('loading');
        submitBtn?.removeAttribute('disabled');
        googleBtn?.removeAttribute('disabled');
        nameInput?.removeAttribute('disabled');
        emailInput?.removeAttribute('disabled');
        passwordInput?.removeAttribute('disabled');
        confirmInput?.removeAttribute('disabled');
        clearOnboardingStatus();
    }
}

function resetOnboardingForm() {
    const nameInput = document.getElementById('onboardingName');
    const emailInput = document.getElementById('onboardingEmail');
    const passwordInput = document.getElementById('onboardingPassword');
    const confirmInput = document.getElementById('onboardingPasswordConfirm');
    const errorEl = document.getElementById('onboardingError');
    
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmInput) confirmInput.value = '';
    if (errorEl) errorEl.textContent = '';
    
    state.pendingEmail = null;
}

function prefillOnboardingEmail() {
    if (state.pendingEmail) {
        const emailInput = document.getElementById('onboardingEmail');
        if (emailInput) {
            emailInput.value = state.pendingEmail;
        }
        // Focus on name field since email is pre-filled
        const nameInput = document.getElementById('onboardingName');
        nameInput?.focus();
    }
}

// ============================================
// User Avatar
// ============================================

function initUserAvatar() {
    const avatarBtn = document.getElementById('userAvatarBtn');
    const dropdown = document.getElementById('userDropdown');
    const signOutBtn = document.getElementById('btnSignOut');
    
    if (!avatarBtn || !dropdown) return;
    
    // Toggle dropdown on avatar click
    avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-avatar-container')) {
            dropdown.classList.remove('open');
        }
    });
    
    // Sign out button
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            dropdown.classList.remove('open');
            try {
                await signOut();
                // Navigate back to welcome screen
                showSlide('welcome');
            } catch (error) {
                console.error('Sign out error:', error);
            }
        });
    }
}

function updateUserAvatarVisibility() {
    const avatarContainer = document.getElementById('userAvatarContainer');
    if (!avatarContainer) return;
    
    // Slides where the avatar should be visible (post sign-in)
    const postSignInSlides = ['drop', 'ready', 'progress', 'complete'];
    
    // Show avatar only if user is signed in AND on a post-sign-in slide
    if (state.user && postSignInSlides.includes(state.currentSlide)) {
        avatarContainer.classList.add('visible');
    } else {
        avatarContainer.classList.remove('visible');
        // Also close dropdown when hiding
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('open');
    }
}

// ============================================
// Modal Handling
// ============================================

function initModals() {
    // Open Privacy Policy modal
    document.getElementById('openPrivacyModal')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('privacy-modal');
    });
    
    // Open Terms of Service modal
    document.getElementById('openTermsModal')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('terms-modal');
    });
    
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) closeModal(modal.id);
        });
    });
    
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
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
    
    // Editor dropdown
    initEditorDropdown();
}

// ============================================
// Editor Dropdown
// ============================================

function initEditorDropdown() {
    const dropdown = document.getElementById('editorDropdown');
    const btn = document.getElementById('btnOpenInEditor');
    const menu = document.getElementById('editorDropdownMenu');
    const chevron = dropdown?.querySelector('.editor-dropdown-chevron');
    
    if (!dropdown || !btn || !menu) return;
    
    // Set initial selected state from localStorage
    updateEditorSelection(state.selectedEditor);
    
    // Toggle dropdown on chevron click
    chevron?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    
    // Open in editor on main button click (excluding chevron area)
    btn.addEventListener('click', async (e) => {
        // If clicking the chevron, don't open editor
        if (e.target.closest('.editor-dropdown-chevron')) return;
        
        // Close dropdown if open
        dropdown.classList.remove('open');
        
        // Open in selected editor
        if (window.pywebview) {
            const result = await window.pywebview.api.open_in_editor(state.selectedEditor);
            if (result && result.error) {
                console.error('Failed to open in editor:', result.error);
                // Could show a toast/notification here
            }
        }
    });
    
    // Handle editor option selection
    menu.querySelectorAll('.editor-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const editor = option.dataset.editor;
            if (editor) {
                selectEditor(editor);
                dropdown.classList.remove('open');
            }
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
}

function selectEditor(editor) {
    state.selectedEditor = editor;
    localStorage.setItem('docprep_selected_editor', editor);
    updateEditorSelection(editor);
}

function updateEditorSelection(editor) {
    const menu = document.getElementById('editorDropdownMenu');
    const btnText = document.querySelector('.editor-btn-text');
    const btnIcon = document.getElementById('editorBtnIcon');
    if (!menu) return;
    
    // Editor display names
    const editorNames = {
        'cursor': 'Cursor',
        'windsurf': 'Windsurf',
        'antigravity': 'Antigravity'
    };
    
    // Update button text to show selected editor
    if (btnText && editor && editorNames[editor]) {
        btnText.textContent = `Open in ${editorNames[editor]}`;
    }
    
    // Update button icon to show selected editor's logo
    if (btnIcon && editor) {
        const selectedOption = menu.querySelector(`.editor-option[data-editor="${editor}"] .editor-option-icon`);
        if (selectedOption) {
            btnIcon.innerHTML = selectedOption.innerHTML;
        }
    }
    
    // Update selected state on options
    menu.querySelectorAll('.editor-option').forEach(option => {
        if (option.dataset.editor === editor) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
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
    initSignInForm();
    initEmailSignInForm();
    initOnboardingForm();
    initModals();

    // Check if LibreOffice is available for PPTX image extraction
    await checkLibreOfficeAvailable();

    // Hide footer initially
    const footer = document.getElementById('appFooter');
    if (footer) {
        footer.classList.add('hidden');
    }

    // Show welcome slide immediately (with loading spinner on button)
    showSlide('welcome');
    
    // Wait for Firebase auth to determine initial state
    const user = await initAuth();
    
    // Initialize avatar handlers after auth is ready
    initUserAvatarHandlers();
    
    // Handle auth state result
    const getStartedBtn = document.getElementById('btnGetStarted');
    
    if (user) {
        // User is already signed in, go directly to drop zone
        showSlide('drop');
    } else {
        // Not signed in - reveal the "Get Started" button
        if (getStartedBtn) {
            getStartedBtn.classList.remove('btn-auth-loading');
            getStartedBtn.classList.add('btn-auth-ready');
        }
    }
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
    // The PPTX toggle is now inside the settings panel
    // Show/hide the toggle option based on LibreOffice availability
    const pptxToggle = document.getElementById('pptxImagesToggle');
    if (pptxToggle) {
        const toggleOption = pptxToggle.closest('.toggle-option');
        if (toggleOption) {
            toggleOption.style.display = state.libreOfficeAvailable ? 'flex' : 'none';
        }
    }
}

// ============================================
// Google OAuth Callbacks (called from Python)
// ============================================

async function googleSignInSuccess(tokens) {
    try {
        // Clear both sign-in and onboarding states
        clearSignInError();
        clearSignInStatus();
        clearOnboardingError();
        clearOnboardingStatus();
        
        await signInWithGoogleCredential(tokens.idToken, tokens.accessToken);
        // Success - auth state listener will handle navigation
    } catch (error) {
        // Show error on whichever page is active
        if (state.currentSlide === 'onboarding') {
            showOnboardingError(getAuthErrorMessage(error));
        } else {
            showSignInError(getAuthErrorMessage(error));
        }
    } finally {
        setSignInLoading(false);
        setOnboardingLoading(false);
    }
}

function googleSignInError(errorMessage) {
    // Clear and show error on whichever page is active
    if (state.currentSlide === 'onboarding') {
        clearOnboardingStatus();
        showOnboardingError(errorMessage || 'Google sign-up failed');
        setOnboardingLoading(false);
    } else {
        clearSignInStatus();
        showSignInError(errorMessage || 'Google sign-in failed');
        setSignInLoading(false);
    }
}

// Expose functions for Python to call
window.updateProgress = updateProgress;
window.updateCurrentFile = updateCurrentFile;
window.updateSubStep = updateSubStep;
window.showComplete = showComplete;
window.showCancelled = showCancelled;
window.showError = showError;
window.googleSignInSuccess = googleSignInSuccess;
window.googleSignInError = googleSignInError;

