import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Lock } from 'lucide-react';

// IDE Logo components
function CursorLogo() {
  return (
    <svg className="h-10 w-10" fill="currentColor" fillRule="evenodd" viewBox="0 0 24 24">
      <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z"/>
    </svg>
  );
}

function WindsurfLogo() {
  return (
    <svg className="h-10 w-10" fill="none" viewBox="0 0 512 512">
      <path fillRule="evenodd" clipRule="evenodd" d="M507.307 106.752h-4.864a46.653 46.653 0 00-43.025 28.969 46.66 46.66 0 00-3.482 17.879v104.789c0 20.907-17.152 37.867-37.547 37.867a38.785 38.785 0 01-31.402-16.491l-106.07-152.832a46.865 46.865 0 00-38.613-20.266c-24.192 0-45.952 20.736-45.952 46.357v105.387c0 20.906-17.003 37.866-37.547 37.866-12.16 0-24.234-6.165-31.402-16.49L8.704 108.757C6.016 104.917 0 106.816 0 111.531v91.392c0 4.608 1.408 9.088 4.01 12.885l116.801 168.299c6.912 9.941 17.066 17.322 28.821 20.01 29.376 6.742 56.427-16.085 56.427-45.162V253.653c0-20.906 16.789-37.866 37.546-37.866h.043c12.501 0 24.213 6.144 31.403 16.49L381.12 385.088a45.872 45.872 0 0038.613 20.267c24.704 0 45.888-20.758 45.888-46.358V253.632c0-20.907 16.79-37.867 37.547-37.867h4.139c2.602 0 4.693-2.133 4.693-4.736v-99.562a4.7 4.7 0 00-1.366-3.34 4.705 4.705 0 00-3.327-1.396v.021z" fill="currentColor"/>
    </svg>
  );
}

function AntigravityLogo() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
      <path d="m19.94,20.59c1.09.82,2.73.27,1.23-1.23-4.5-4.36-3.55-16.36-9.14-16.36S7.39,15,2.89,19.36c-1.64,1.64.14,2.05,1.23,1.23,4.23-2.86,3.95-7.91,7.91-7.91s3.68,5.05,7.91,7.91Z"/>
    </svg>
  );
}

interface IdeCardProps {
  name: string;
  href: string;
  logo: React.ReactNode;
}

function IdeCard({ name, href, logo }: IdeCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-3 p-6 bg-card rounded-xl border border-border hover:border-primary/50 hover:bg-card/80 transition-all duration-200 group"
    >
      <div className="text-primary group-hover:scale-110 transition-transform duration-200">
        {logo}
      </div>
      <span className="text-sm font-medium text-foreground">{name}</span>
    </a>
  );
}

export function Tutorial() {
  const { goToSlide } = useApp();
  const { isSignedIn } = useAuth();

  const handleContinue = () => {
    if (isSignedIn) {
      goToSlide('drop');
    } else {
      goToSlide('signin');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12">
      <h2 className="text-3xl font-semibold text-foreground mb-2">AI-Ready Data</h2>
      <p className="text-muted-foreground mb-8">
        Open your extracted folder in an AI-integrated editor of your choice
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg w-full">
        <IdeCard name="Cursor" href="https://cursor.com/?from=home" logo={<CursorLogo />} />
        <IdeCard name="Windsurf" href="https://windsurf.com/" logo={<WindsurfLogo />} />
        <IdeCard name="Antigravity" href="https://antigravity.google/" logo={<AntigravityLogo />} />
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
        Chat with your business documents natively. Make plans, visualizations, and more.
      </p>

      <div className="flex items-center gap-3 p-4 bg-card/50 rounded-lg border border-border max-w-md">
        <Lock className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          All processing happens locally on your device. Your documents never leave your computer.
        </p>
      </div>

      <div className="fixed bottom-20 left-0 right-0 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground"
          onClick={() => goToSlide('intro')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          className="rounded-full px-8 gap-2"
          onClick={handleContinue}
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

