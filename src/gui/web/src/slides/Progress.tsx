import { useApp } from '@/context/AppContext';
import { usePyWebview } from '@/hooks/usePyWebview';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export function Progress() {
  const { state, goToSlide } = useApp();
  const { skipExtraction, cancelExtraction } = usePyWebview();

  const percent = state.progressTotal > 0
    ? Math.round((state.progressCurrent / state.progressTotal) * 100)
    : 0;

  const handleSkip = async () => {
    await skipExtraction();
  };

  const handleCancel = async () => {
    await cancelExtraction();
    goToSlide('welcome');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <h2 className="text-2xl font-semibold text-foreground">
          Extracting documents
        </h2>
      </div>

      <div className="w-full max-w-md space-y-3 mb-8">
        <ProgressBar value={percent} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-primary font-medium">{percent}%</span>
          <span className="text-muted-foreground">
            {state.progressCurrent} / {state.progressTotal} files
          </span>
        </div>
      </div>

      <div className="text-center space-y-1 mb-12">
        <p className="text-sm text-muted-foreground">Currently processing:</p>
        <p className="text-foreground font-medium">{state.currentFileName}</p>
        {state.currentSubStep && (
          <p className="text-xs text-muted-foreground animate-pulse">
            {state.currentSubStep}
          </p>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={handleSkip}
        >
          Skip
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive hover:border-destructive"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

