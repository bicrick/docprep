import { useCallback, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { usePyWebview } from '@/hooks/usePyWebview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DropZone() {
  const { goToSlide, setFolder } = useApp();
  const { user } = useAuth();
  const { selectFolder, validateFolder } = usePyWebview();
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    const result = await selectFolder();
    if (result) {
      setFolder(result);
      goToSlide('ready');
    }
  }, [selectFolder, setFolder, goToSlide]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    // Don't preventDefault or stopPropagation - let it bubble to Python
    setIsDragging(true);
    setDragError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Must preventDefault to allow drop, but don't stopPropagation
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Don't preventDefault or stopPropagation - let it bubble to Python
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    // Don't preventDefault or stopPropagation - let Python handle it
    setIsDragging(false);
    setDragError(null);
    
    // Python's DOM handler will process the drop and call window.handleFolderDrop
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className="text-3xl font-semibold text-foreground mb-2">Select a folder</h2>
      <p className="text-muted-foreground mb-8">Choose the folder containing your documents</p>

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'w-full max-w-md aspect-[4/3] rounded-2xl',
          'border-2 border-dashed',
          'flex flex-col items-center justify-center gap-4',
          'cursor-pointer transition-all duration-200',
          isDragging 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-primary/5'
        )}
      >
        <div className={cn(
          'p-4 rounded-full transition-all duration-200',
          isDragging ? 'bg-primary/20 scale-110' : 'bg-primary/10'
        )}>
          {isDragging ? (
            <FolderOpen className="h-8 w-8 text-primary" strokeWidth={1.5} />
          ) : (
            <Upload className="h-8 w-8 text-primary" strokeWidth={1.5} />
          )}
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-1">
            {isDragging ? 'Release to select folder' : 'Drop your folder here'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isDragging ? 'Drop it like it\'s hot' : 'or click to browse'}
          </p>
        </div>
        {dragError && (
          <p className="text-sm text-destructive mt-2">{dragError}</p>
        )}
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

