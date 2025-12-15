import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { usePyWebview } from '@/hooks/usePyWebview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Folder, FolderPlus, Pencil, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Ready() {
  const { state, goToSlide, setOutputName, validateOutputName, updateOutputPath, setParentPath, setPptxImages, startExtraction } = useApp();
  const { selectFolder, browseOutputFolder } = usePyWebview();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Validate and update path when output name changes
  useEffect(() => {
    validateOutputName();
    updateOutputPath();
  }, [state.outputFolderName, validateOutputName, updateOutputPath]);

  const handleBrowseOutput = useCallback(async () => {
    const result = await browseOutputFolder();
    if (result) {
      setParentPath(result.parent_path, result.children_names || []);
    }
  }, [browseOutputFolder, setParentPath]);

  const handleChangeSource = useCallback(async () => {
    const result = await selectFolder();
    if (result) {
      // Re-set the folder which will reset all state
      window.location.reload(); // Simplest approach for now
    }
  }, [selectFolder]);

  const handleStart = useCallback(() => {
    if (validateOutputName()) {
      startExtraction();
    }
  }, [validateOutputName, startExtraction]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold text-foreground">Ready to extract</h2>
          <p className="text-muted-foreground mt-1">
            <span className="font-medium">{state.fileCount}</span> files will be processed
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          {/* Workflow Row */}
          <div className="flex items-start gap-6">
            {/* Source */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">From</Label>
              <button
                onClick={handleChangeSource}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg',
                  'bg-background border border-border',
                  'hover:border-primary/50 transition-colors',
                  'text-left group'
                )}
              >
                <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="flex-1 truncate font-medium">{state.folderName}</span>
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <p className="text-xs text-muted-foreground truncate">{state.folderPath}</p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 pt-8">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Destination */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">To</Label>
              <div
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg',
                  'bg-background border',
                  state.outputNameValid ? 'border-border' : 'border-destructive',
                )}
              >
                <FolderPlus className="h-5 w-5 text-primary flex-shrink-0" />
                <Input
                  value={state.outputFolderName}
                  onChange={(e) => setOutputName(e.target.value)}
                  className="flex-1 border-0 p-0 h-auto bg-transparent focus-visible:ring-0"
                  placeholder="extracted_files"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  onClick={handleBrowseOutput}
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground truncate">{state.outputFolderPath}</p>
              {!state.outputNameValid && (
                <p className="text-xs text-destructive">{state.outputNameError}</p>
              )}
            </div>
          </div>

          {/* Options Section */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center justify-between w-full p-2 -m-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Options</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  settingsOpen && 'rotate-180'
                )}
              />
            </button>

            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                settingsOpen ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'
              )}
            >
              <div className="space-y-3">
                {state.libreOfficeAvailable && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pptx-images" className="text-sm">
                      Extract PowerPoint images
                    </Label>
                    <Switch
                      id="pptx-images"
                      checked={state.extractPptxImages}
                      onCheckedChange={setPptxImages}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Add summary files</Label>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                  </div>
                  <Switch disabled />
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Extract all images</Label>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Your original files will not be modified.
        </p>
      </div>

      <div className="fixed bottom-20 left-0 right-0 flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => goToSlide('drop')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          className="gap-2"
          onClick={handleStart}
          disabled={!state.outputNameValid || !state.outputFolderName}
        >
          Extract
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

