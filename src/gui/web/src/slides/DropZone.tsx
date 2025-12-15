import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { usePyWebview } from '@/hooks/usePyWebview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DropZone() {
  const { goToSlide, setFolder } = useApp();
  const { user } = useAuth();
  const { selectFolder, validateFolder } = usePyWebview();

  const handleClick = useCallback(async () => {
    const result = await selectFolder();
    if (result) {
      setFolder(result);
      goToSlide('ready');
    }
  }, [selectFolder, setFolder, goToSlide]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'bg-primary/5');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const path = (files[0] as File & { path?: string }).path;
      if (path) {
        const result = await validateFolder(path);
        if (result) {
          setFolder(result);
          goToSlide('ready');
        }
      }
    }
  }, [validateFolder, setFolder, goToSlide]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className="text-3xl font-semibold text-foreground mb-2">Select a folder</h2>
      <p className="text-muted-foreground mb-8">Choose the folder containing your documents</p>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'w-full max-w-md aspect-[4/3] rounded-2xl',
          'border-2 border-dashed border-border',
          'flex flex-col items-center justify-center gap-4',
          'cursor-pointer transition-all duration-200',
          'hover:border-primary/50 hover:bg-primary/5'
        )}
      >
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-1">Drop your folder here</h3>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 flex items-center justify-center">
        {!user && (
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => goToSlide('signin')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>
    </div>
  );
}

