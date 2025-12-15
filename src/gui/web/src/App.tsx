import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/hooks/useAuth';
import { SlideContainer } from '@/components/SlideContainer';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserAvatar } from '@/components/UserAvatar';
import { PolkaDots } from '@/components/PolkaDots';
import { UpdateNotice } from '@/components/UpdateNotice';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
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

