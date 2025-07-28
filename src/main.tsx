import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { initializeErrorFiltering } from './lib/errorFilter'

// Initialize error filtering for cleaner development console
initializeErrorFiltering();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
