import { useApp, SlideId, SLIDE_ORDER } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

// Import all slides
import { Welcome } from '@/slides/Welcome';
import { Intro } from '@/slides/Intro';
import { Tutorial } from '@/slides/Tutorial';
import { SignIn } from '@/slides/SignIn';
import { EmailSignIn } from '@/slides/EmailSignIn';
import { Onboarding } from '@/slides/Onboarding';
import { DropZone } from '@/slides/DropZone';
import { Ready } from '@/slides/Ready';
import { Progress } from '@/slides/Progress';
import { Complete } from '@/slides/Complete';

// Map slide IDs to components
// When adding a new slide, add its component here AND add it to SLIDE_ORDER in AppContext.tsx
const slideComponents: Record<SlideId, React.ComponentType> = {
  welcome: Welcome,
  intro: Intro,
  tutorial: Tutorial,
  signin: SignIn,
  'email-signin': EmailSignIn,
  onboarding: Onboarding,
  drop: DropZone,
  ready: Ready,
  progress: Progress,
  complete: Complete,
};

interface SlideProps {
  id: SlideId;
  isActive: boolean;
  isExiting: boolean;
  direction: 'forward' | 'backward';
}

function Slide({ id, isActive, isExiting, direction }: SlideProps) {
  const Component = slideComponents[id];

  return (
    <section
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        'opacity-0 pointer-events-none',
        isActive && !isExiting && 'opacity-100 pointer-events-auto',
        isActive && !isExiting && (direction === 'forward' ? 'slide-enter-forward' : 'slide-enter-backward'),
        isExiting && (direction === 'forward' ? 'slide-exit-forward' : 'slide-exit-backward')
      )}
    >
      <Component />
    </section>
  );
}

// Slides that require authentication to proceed past
const PRE_AUTH_SLIDES: SlideId[] = ['welcome', 'intro', 'tutorial', 'signin', 'email-signin', 'onboarding'];

export function SlideContainer() {
  const { state, goToSlide } = useApp();
  const { user, isLoading } = useAuth();

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    // If user is signed in and on any pre-auth slide, go to drop zone
    if (user && PRE_AUTH_SLIDES.includes(state.currentSlide)) {
      goToSlide('drop');
    }
  }, [user, isLoading, state.currentSlide, goToSlide]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {SLIDE_ORDER.map((slideId) => (
        <Slide
          key={slideId}
          id={slideId}
          isActive={state.currentSlide === slideId}
          isExiting={state.previousSlide === slideId && state.currentSlide !== slideId}
          direction={state.slideDirection}
        />
      ))}
    </div>
  );
}

