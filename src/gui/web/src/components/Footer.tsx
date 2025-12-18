import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function Footer() {
  const { state } = useApp();
  const isHidden = state.currentSlide === 'welcome';

  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 flex items-center justify-center py-4 z-10',
        'transition-opacity duration-300',
        isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      <span className="font-serif text-sm text-muted-foreground tracking-wide">
        docprep
      </span>
    </footer>
  );
}





