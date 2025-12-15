import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  initFirebase,
  getCurrentUser,
  isSignedIn as checkIsSignedIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signInWithGoogleCredential,
  signInWithEmail as firebaseSignInWithEmail,
  createAccountWithEmail as firebaseCreateAccount,
  sendPasswordReset as firebaseSendPasswordReset,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getUserDisplayInfo,
  fetchSignInMethodsForEmail as firebaseFetchSignInMethods,
  getAuthErrorMessage,
  type FirebaseUser,
  type UserDisplayInfo,
} from '@/lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  userInfo: UserDisplayInfo | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  createAccount: (email: string, password: string, displayName?: string) => Promise<FirebaseUser>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchSignInMethods: (email: string) => Promise<string[]>;
  getErrorMessage: (error: Error) => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Firebase and listen for auth changes
  useEffect(() => {
    const firebaseReady = initFirebase();
    if (!firebaseReady) {
      console.warn('Firebase not initialized - auth features will be disabled');
      setIsLoading(false);
      return;
    }

    setIsInitialized(true);

    const unsubscribe = onAuthStateChanged((authUser) => {
      console.log('Auth state changed:', authUser ? `User: ${authUser.email}` : 'No user');
      setUser(authUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up global callbacks for desktop OAuth flow
  useEffect(() => {
    if (!isInitialized) return;

    window.googleSignInSuccess = async (tokens) => {
      try {
        await signInWithGoogleCredential(tokens.idToken, tokens.accessToken || null);
      } catch (error) {
        console.error('Google sign-in callback error:', error);
      }
    };

    window.googleSignInError = (errorMessage) => {
      console.error('Google sign-in error:', errorMessage);
    };

    return () => {
      // Clean up global callbacks
      delete (window as Partial<typeof window>).googleSignInSuccess;
      delete (window as Partial<typeof window>).googleSignInError;
    };
  }, [isInitialized]);

  const signInWithGoogle = useCallback(async (): Promise<FirebaseUser | null> => {
    // Check if running in pywebview (desktop app)
    if (window.pywebview) {
      await window.pywebview.api.start_google_signin();
      // OAuth flow started in external browser
      // Result will come via googleSignInSuccess callback, auth listener handles navigation
      // Return null to indicate pending - component should reset loading state
      return null;
    } else {
      // Web fallback - use popup
      return firebaseSignInWithGoogle();
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<FirebaseUser> => {
    return firebaseSignInWithEmail(email, password);
  }, []);

  const createAccount = useCallback(async (email: string, password: string, displayName?: string): Promise<FirebaseUser> => {
    const newUser = await firebaseCreateAccount(email, password);
    
    // Update display name after account creation
    if (displayName && newUser) {
      try {
        await newUser.updateProfile({ displayName });
        console.log('Display name updated to:', displayName);
      } catch (profileError) {
        console.warn('Could not update display name:', profileError);
      }
    }
    
    return newUser;
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<void> => {
    return firebaseSendPasswordReset(email);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    return firebaseSignOut();
  }, []);

  const fetchSignInMethods = useCallback(async (email: string): Promise<string[]> => {
    return firebaseFetchSignInMethods(email);
  }, []);

  const getErrorMessage = useCallback((error: Error): string => {
    return getAuthErrorMessage(error);
  }, []);

  const value: AuthContextType = {
    user,
    userInfo: getUserDisplayInfo(user),
    isLoading,
    isSignedIn: checkIsSignedIn(),
    signInWithGoogle,
    signInWithEmail,
    createAccount,
    sendPasswordReset,
    signOut,
    fetchSignInMethods,
    getErrorMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export for convenience
export { getCurrentUser, checkIsSignedIn as isSignedIn };

