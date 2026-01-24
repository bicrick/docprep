import { useApp } from '@/context/AppContext';
import { usePyWebview } from '@/hooks/usePyWebview';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
      <Card className="w-[32rem] shadow-lg">
        <CardHeader className="text-center space-y-2 pb-6">
          <CardTitle className="text-2xl">Extracting documents</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress bar section with larger bar */}
          <div className="space-y-3">
            <ProgressBar value={percent} className="h-3" />
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-primary">{percent}%</span>
              <span className="text-muted-foreground">
                {state.progressCurrent} / {state.progressTotal} files
              </span>
            </div>
          </div>
          
          <Separator />
          
          {/* Filename section with background box */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Currently processing:
            </p>
            <div className="bg-muted/30 rounded-lg p-4 min-h-[72px] flex items-center justify-center">
              <p className="font-medium text-center line-clamp-2 transition-all duration-300">
                {state.currentFileName}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center min-h-[20px] animate-pulse">
              {state.currentSubStep || '\u00A0'}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center gap-3 pt-6">
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
        </CardFooter>
      </Card>
    </div>
  );
}

