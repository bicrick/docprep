import { useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider } from '@/hooks/useAuth';
import { SlideContainer } from '@/components/SlideContainer';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserAvatar } from '@/components/UserAvatar';
import { PolkaDots } from '@/components/PolkaDots';
import { UpdateNotice } from '@/components/UpdateNotice';
import type { FolderData } from '@/lib/firebase';

// Component to set up global handlers
function GlobalHandlers() {
  const { setFolder, goToSlide } = useApp();
  
  useEffect(() => {
    // Set up global handler for drag-and-drop from Python
    window.handleFolderDrop = (folderData: FolderData) => {
      setFolder(folderData);
      goToSlide('ready');
    };
    
    return () => {
      delete (window as any).handleFolderDrop;
    };
  }, [setFolder, goToSlide]);
  
  return null;
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <GlobalHandlers />
        <div className="relative h-full overflow-hidden">
          <PolkaDots />
          <SlideContainer />
          <Footer />
          <ThemeToggle />
          <UserAvatar />
          <UpdateNotice />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

