import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center h-8 w-8 border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};
