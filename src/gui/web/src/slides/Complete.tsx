import { useState, useCallback } from 'react';
import { useApp, EditorId } from '@/context/AppContext';
import { usePyWebview } from '@/hooks/usePyWebview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, ExternalLink, ChevronDown, ArrowLeft, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Editor logos
function CursorLogo() {
  return (
    <svg className="h-4 w-4" fill="currentColor" fillRule="evenodd" viewBox="0 0 24 24">
      <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z"/>
    </svg>
  );
}

function WindsurfLogo() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 512 512">
      <path fillRule="evenodd" clipRule="evenodd" d="M507.307 106.752h-4.864a46.653 46.653 0 00-43.025 28.969 46.66 46.66 0 00-3.482 17.879v104.789c0 20.907-17.152 37.867-37.547 37.867a38.785 38.785 0 01-31.402-16.491l-106.07-152.832a46.865 46.865 0 00-38.613-20.266c-24.192 0-45.952 20.736-45.952 46.357v105.387c0 20.906-17.003 37.866-37.547 37.866-12.16 0-24.234-6.165-31.402-16.49L8.704 108.757C6.016 104.917 0 106.816 0 111.531v91.392c0 4.608 1.408 9.088 4.01 12.885l116.801 168.299c6.912 9.941 17.066 17.322 28.821 20.01 29.376 6.742 56.427-16.085 56.427-45.162V253.653c0-20.906 16.789-37.866 37.546-37.866h.043c12.501 0 24.213 6.144 31.403 16.49L381.12 385.088a45.872 45.872 0 0038.613 20.267c24.704 0 45.888-20.758 45.888-46.358V253.632c0-20.907 16.79-37.867 37.547-37.867h4.139c2.602 0 4.693-2.133 4.693-4.736v-99.562a4.7 4.7 0 00-1.366-3.34 4.705 4.705 0 00-3.327-1.396v.021z"/>
    </svg>
  );
}

function AntigravityLogo() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="m19.94,20.59c1.09.82,2.73.27,1.23-1.23-4.5-4.36-3.55-16.36-9.14-16.36S7.39,15,2.89,19.36c-1.64,1.64.14,2.05,1.23,1.23,4.23-2.86,3.95-7.91,7.91-7.91s3.68,5.05,7.91,7.91Z"/>
    </svg>
  );
}

const editorInfo: Record<EditorId, { name: string; logo: React.ReactNode }> = {
  cursor: { name: 'Cursor', logo: <CursorLogo /> },
  windsurf: { name: 'Windsurf', logo: <WindsurfLogo /> },
  antigravity: { name: 'Antigravity', logo: <AntigravityLogo /> },
};

type DetailView = 'succeeded' | 'warnings' | 'failed' | null;

export function Complete() {
  const { state, goToSlide, resetState, setSelectedEditor } = useApp();
  const { openOutputFolder, openInEditor } = usePyWebview();
  const [detailView, setDetailView] = useState<DetailView>(null);

  const results = state.extractionResults;

  const handleNewExtraction = useCallback(() => {
    resetState();
    goToSlide('drop');
  }, [resetState, goToSlide]);

  const handleOpenInEditor = useCallback(async () => {
    const result = await openInEditor(state.selectedEditor);
    if (result?.error) {
      console.error('Failed to open in editor:', result.error);
    }
  }, [openInEditor, state.selectedEditor]);

  const handleOpenFolder = useCallback(async () => {
    await openOutputFolder();
  }, [openOutputFolder]);

  const succeededCount = results?.succeeded?.length || 0;
  const warningsCount = results?.warnings?.length || 0;
  const failedCount = results?.failed?.length || 0;

  if (detailView) {
    const items = detailView === 'succeeded'
      ? (results?.succeeded || []).map(item => ({ ...item, status: 'succeeded' as const }))
      : detailView === 'warnings'
        ? (results?.warnings || []).map(item => ({ ...item, status: 'warning' as const }))
        : (results?.failed || []).map(item => ({ ...item, status: 'failed' as const }));

    const title = detailView === 'succeeded'
      ? 'Succeeded Files'
      : detailView === 'warnings'
        ? 'Files with Warnings'
        : 'Failed Files';

    return (
      <div className="flex flex-col h-full px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailView(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {items.map((item, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3 flex items-start gap-3">
                {item.status === 'succeeded' && (
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                )}
                {item.status === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                )}
                {item.status === 'failed' && (
                  <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.file}</p>
                  {'output_count' in item && item.output_count !== undefined && (
                    <p className="text-xs text-muted-foreground">{item.output_count} files created</p>
                  )}
                  {'messages' in item && item.messages?.map((msg, i) => (
                    <p key={i} className="text-xs text-muted-foreground mt-1">{msg}</p>
                  ))}
                  {'errors' in item && item.errors?.map((err, i) => (
                    <p key={i} className="text-xs text-destructive mt-1">{err}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="secondary" onClick={() => setDetailView(null)}>
            Back to Summary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-foreground">Extraction Complete</h2>
        <p className="text-muted-foreground mt-1">Your documents have been processed</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Files Processed</p>
            <p className="text-3xl font-semibold text-primary">{results?.processed || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Files Extracted</p>
            <p className="text-3xl font-semibold text-foreground">{results?.extracted || 0}</p>
          </CardContent>
        </Card>

        {succeededCount > 0 && (
          <Card
            className="cursor-pointer hover:border-success/50 transition-colors"
            onClick={() => setDetailView('succeeded')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Succeeded</p>
              <p className="text-2xl font-semibold text-success">{succeededCount}</p>
            </CardContent>
          </Card>
        )}

        {warningsCount > 0 && (
          <Card
            className="cursor-pointer hover:border-warning/50 transition-colors"
            onClick={() => setDetailView('warnings')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Warnings</p>
              <p className="text-2xl font-semibold text-warning">{warningsCount}</p>
            </CardContent>
          </Card>
        )}

        {failedCount > 0 && (
          <Card
            className="cursor-pointer hover:border-destructive/50 transition-colors"
            onClick={() => setDetailView('failed')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Failed</p>
              <p className="text-2xl font-semibold text-destructive">{failedCount}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" className="gap-2" onClick={handleNewExtraction}>
          <RefreshCw className="h-4 w-4" />
          New Extraction
        </Button>

        <div className="flex items-center">
          <Button 
            className="gap-2 rounded-r-none border-r-0" 
            onClick={handleOpenInEditor}
          >
            {editorInfo[state.selectedEditor].logo}
            Open in {editorInfo[state.selectedEditor].name}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="px-2 rounded-l-none border-l border-l-primary-foreground/20">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(editorInfo) as EditorId[]).map((editor) => (
                <DropdownMenuItem
                  key={editor}
                  onClick={() => setSelectedEditor(editor)}
                  className={cn(
                    'gap-2',
                    state.selectedEditor === editor && 'bg-accent'
                  )}
                >
                  {editorInfo[editor].logo}
                  {editorInfo[editor].name}
                  {state.selectedEditor === editor && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button variant="secondary" className="gap-2" onClick={handleOpenFolder}>
          Open Output Folder
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

