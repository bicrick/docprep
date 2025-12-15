import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserAvatar() {
  const { user, userInfo, signOut } = useAuth();
  const { state, goToSlide } = useApp();

  // Only show on post sign-in slides when user is logged in
  const postSignInSlides = ['drop', 'ready', 'progress', 'complete'];
  const isVisible = user && postSignInSlides.includes(state.currentSlide);

  const handleSignOut = async () => {
    try {
      await signOut();
      goToSlide('welcome');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getInitial = () => {
    if (userInfo?.displayName) {
      return userInfo.displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-16 z-50 transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="User menu"
          >
            <Avatar className="h-10 w-10 cursor-pointer border-2 border-border hover:border-primary transition-colors">
              {userInfo?.photoURL && (
                <AvatarImage src={userInfo.photoURL} alt={userInfo.displayName || 'User'} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {userInfo?.displayName || 'User'}
              </p>
              {userInfo?.email && (
                <p className="text-xs text-muted-foreground leading-none">
                  {userInfo.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

