/**
 * Firebase Authentication Module
 * Handles Firebase initialization and auth helpers
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCBjcHE19f-FEyVh5uCrIjVep_j0J19Xx0",
    authDomain: "docprep-app-b4e18.firebaseapp.com",
    projectId: "docprep-app-b4e18",
    storageBucket: "docprep-app-b4e18.firebasestorage.app",
    messagingSenderId: "125874830244",
    appId: "1:125874830244:web:1615ac03aae291154b5f31",
    measurementId: "G-83MRCGEEZH"
};

// Firebase SDK loaded via CDN in index.html
let app = null;
let auth = null;
let googleProvider = null;

/**
 * Initialize Firebase
 * Must be called after Firebase SDK is loaded
 */
export function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Make sure to include Firebase scripts in index.html');
        return false;
    }
    
    try {
        // Initialize Firebase app if not already done
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.apps[0];
        }
        
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        
        // Set persistence to LOCAL (survives browser restarts)
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

/**
 * Get the current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
    if (!auth) return null;
    return auth.currentUser;
}

/**
 * Check if user is signed in
 * @returns {boolean}
 */
export function isSignedIn() {
    return !!getCurrentUser();
}

/**
 * Sign in with Google popup (fallback for web)
 * @returns {Promise<Object>} User credential
 */
export async function signInWithGoogle() {
    if (!auth || !googleProvider) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        const result = await auth.signInWithPopup(googleProvider);
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
}

/**
 * Sign in with Google credential (for desktop OAuth flow)
 * @param {string} idToken - Google ID token
 * @param {string} accessToken - Google access token (optional)
 * @returns {Promise<Object>} User
 */
export async function signInWithGoogleCredential(idToken, accessToken = null) {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        // Create credential from tokens
        const credential = firebase.auth.GoogleAuthProvider.credential(idToken, accessToken);
        const result = await auth.signInWithCredential(credential);
        return result.user;
    } catch (error) {
        console.error('Google credential sign-in error:', error);
        throw error;
    }
}

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} User credential
 */
export async function signInWithEmail(email, password) {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        return result.user;
    } catch (error) {
        console.error('Email sign-in error:', error);
        throw error;
    }
}

/**
 * Create account with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} User credential
 */
export async function createAccountWithEmail(email, password) {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        return result.user;
    } catch (error) {
        console.error('Account creation error:', error);
        throw error;
    }
}

/**
 * Send password reset email
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function sendPasswordReset(email) {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

/**
 * Listen for auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChanged(callback) {
    if (!auth) {
        console.error('Firebase not initialized');
        return () => {};
    }
    
    return auth.onAuthStateChanged(callback);
}

/**
 * Get user display info
 * @param {Object} user - Firebase user object
 * @returns {Object} Display info { displayName, email, photoURL }
 */
export function getUserDisplayInfo(user) {
    if (!user) return null;
    
    return {
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        photoURL: user.photoURL
    };
}

/**
 * Fetch sign-in methods available for an email address
 * @param {string} email 
 * @returns {Promise<string[]>} Array of sign-in methods (e.g., ['password', 'google.com'])
 */
export async function fetchSignInMethodsForEmail(email) {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }
    
    try {
        const methods = await auth.fetchSignInMethodsForEmail(email);
        return methods;
    } catch (error) {
        console.error('Fetch sign-in methods error:', error);
        throw error;
    }
}

/**
 * Get a friendly error message for Firebase auth errors
 * @param {Error} error - Firebase error
 * @returns {string} User-friendly error message
 */
export function getAuthErrorMessage(error) {
    const errorCode = error.code;
    
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed.';
        case 'auth/popup-blocked':
            return 'Sign-in popup was blocked. Please allow popups for this site.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}
