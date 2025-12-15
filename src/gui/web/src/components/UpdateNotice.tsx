import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Download, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpdateNotice() {
  const { state } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Only show on welcome screen when update is available
  const isVisible = state.currentSlide === 'welcome' && state.updateAvailable && !isDismissed;

  // Set up global callbacks for Python to call
  useEffect(() => {
    (window as unknown as { updateDownloadProgress: (percent: number) => void }).updateDownloadProgress = (percent: number) => {
      setDownloadPercent(percent);
      setIsDownloading(true);
      setIsInstalling(false);
      setError(null);
    };

    (window as unknown as { updateInstallStarted: () => void }).updateInstallStarted = () => {
      setIsDownloading(false);
      setIsInstalling(true);
      setError(null);
    };

    (window as unknown as { updateInstallComplete: () => void }).updateInstallComplete = () => {
      setIsInstalling(true);
    };

    (window as unknown as { updateInstallError: (message: string) => void }).updateInstallError = (message: string) => {
      setIsDownloading(false);
      setIsInstalling(false);
      setError(message || 'Update failed');
    };

    return () => {
      delete (window as unknown as { updateDownloadProgress?: unknown }).updateDownloadProgress;
      delete (window as unknown as { updateInstallStarted?: unknown }).updateInstallStarted;
      delete (window as unknown as { updateInstallComplete?: unknown }).updateInstallComplete;
      delete (window as unknown as { updateInstallError?: unknown }).updateInstallError;
    };
  }, []);

  const handleInstall = async () => {
    if (isDownloading || isInstalling) return;

    setError(null);
    setIsDownloading(true);
    setDownloadPercent(0);

    if (window.pywebview) {
      try {
        await (window.pywebview.api as unknown as { download_and_install_update: () => Promise<void> }).download_and_install_update();
      } catch (e) {
        console.error('Failed to start update:', e);
        setIsDownloading(false);
        setError('Failed to start update');
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('updateDismissed', 'true');
  };

  // Check if already dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('updateDismissed') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <Alert
      className={cn(
        'fixed bottom-20 left-0 right-0 mx-auto z-50 max-w-md w-fit',
        'flex items-center gap-3 py-2 px-4',
        'bg-card/95 backdrop-blur-sm border-primary/20',
        'animate-fade-in',
        error && 'border-destructive/50'
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        {isInstalling ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Download className="h-4 w-4 text-primary" />
        )}

        <AlertDescription className="text-sm">
          {error ? (
            <span className="text-destructive">Update failed</span>
          ) : isInstalling ? (
            'Installing update...'
          ) : isDownloading ? (
            <span className="flex items-center gap-2">
              Downloading...
              <span className="text-muted-foreground">{downloadPercent}%</span>
            </span>
          ) : (
            <>
              Update available: <span className="font-medium">v{state.updateVersion}</span>
            </>
          )}
        </AlertDescription>

        {isDownloading && (
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${downloadPercent}%` }}
            />
          </div>
        )}

        {!isDownloading && !isInstalling && (
          <>
            <Button
              size="sm"
              variant="default"
              className="h-7 px-3 text-xs"
              onClick={handleInstall}
            >
              {error ? 'Retry' : 'Install Now'}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </Alert>
  );
}

