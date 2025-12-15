import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

export function Welcome() {
  const { goToSlide } = useApp();
  const { isLoading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="mb-6">
        <span className="font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
          docprep
        </span>
      </div>

      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Make your documents AI-ready. Extract clean text from complex file formats.
      </p>

      <div className="flex items-center gap-4 mb-10">
        <img src="./pdf-logo.svg" alt="PDF" className="h-10 w-10 opacity-80" />
        <img src="./excel-logo.svg" alt="Excel" className="h-10 w-10 opacity-80" />
        <img src="./word-logo.svg" alt="Word" className="h-10 w-10 opacity-80" />
        <img src="./powerpoint-logo.svg" alt="PowerPoint" className="h-10 w-10 opacity-80" />
      </div>

      <Button
        size="lg"
        className="rounded-full px-8 py-6 text-base font-medium gap-2"
        onClick={() => goToSlide('intro')}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <span>Get Started</span>
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
}

