import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme(): Theme | null {
  return localStorage.getItem('theme') as Theme | null;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme() || getSystemTheme());

  const applyTheme = useCallback((newTheme: Theme) => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  }, []);

  useEffect(() => {
    // Apply initial theme
    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme, theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 right-4 z-50 rounded-full w-10 h-10 bg-card/50 backdrop-blur-sm hover:bg-card"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

