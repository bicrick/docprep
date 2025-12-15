import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { PrivacyPolicy, TermsOfService } from '@/components/LegalModals';

export function SignIn() {
  const { goToSlide } = useApp();
  const { signInWithGoogle, getErrorMessage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      const errorObj = err as Error & { code?: string };
      if (errorObj.code !== 'auth/popup-closed-by-user') {
        setError(getErrorMessage(errorObj));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            type="button"
            className="w-full h-11 gap-3"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
            )}
            Login with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full h-11 gap-3"
            onClick={() => goToSlide('email-signin')}
            disabled={isLoading}
          >
            <Mail className="h-5 w-5" />
            Login with Email
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Don't have an account?{' '}
            <button
              className="text-primary hover:underline font-medium"
              onClick={() => goToSlide('onboarding')}
            >
              Sign up
            </button>
          </p>

          <p className="text-xs text-muted-foreground text-center pt-2">
            By continuing, you agree to our{' '}
            <button className="underline hover:text-foreground" onClick={() => setShowTerms(true)}>
              Terms
            </button>{' '}
            and{' '}
            <button className="underline hover:text-foreground" onClick={() => setShowPrivacy(true)}>
              Privacy Policy
            </button>
          </p>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="mt-4 gap-2 text-muted-foreground"
        onClick={() => goToSlide('tutorial')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <PrivacyPolicy />
        </DialogContent>
      </Dialog>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <TermsOfService />
        </DialogContent>
      </Dialog>
    </div>
  );
}
