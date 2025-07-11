import { useEffect } from 'react';
import { SECURITY_HEADERS } from '@/lib/security';

/**
 * SecurityHeaders component that applies security headers via meta tags
 * Note: For production, these should be set at the server/CDN level
 */
export function SecurityHeaders() {
  useEffect(() => {
    // Add security-related meta tags
    const addMetaTag = (name: string, content: string) => {
      // Remove existing tag if present
      const existing = document.querySelector(`meta[http-equiv="${name}"]`);
      if (existing) {
        existing.remove();
      }

      // Add new tag
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    };

    // Apply security headers as meta tags (limited effectiveness, but better than nothing)
    addMetaTag('X-Content-Type-Options', SECURITY_HEADERS['X-Content-Type-Options']);
    addMetaTag('X-Frame-Options', SECURITY_HEADERS['X-Frame-Options']);
    addMetaTag('X-XSS-Protection', SECURITY_HEADERS['X-XSS-Protection']);
    addMetaTag('Referrer-Policy', SECURITY_HEADERS['Referrer-Policy']);

    // Add CSP meta tag (note: limited compared to HTTP header)
    const cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    cspMeta.setAttribute('content', SECURITY_HEADERS['Content-Security-Policy']);
    document.head.appendChild(cspMeta);

    // Disable right-click context menu in production (optional security measure)
    const handleContextMenu = (e: MouseEvent) => {
      if (!import.meta.env.DEV) {
        e.preventDefault();
        return false;
      }
    };

    // Disable F12 and other developer shortcuts in production
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!import.meta.env.DEV) {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'U')
        ) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Disable text selection in production (optional)
    const handleSelectStart = (e: Event) => {
      if (!import.meta.env.DEV) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Console warning for production
 */
export function ConsoleWarning() {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      console.clear();
      console.log(
        '%cSTOP!',
        'color: red; font-size: 50px; font-weight: bold;'
      );
      console.log(
        '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone\'s account, it is a scam and will give them access to your account.',
        'color: red; font-size: 16px;'
      );
      console.log(
        '%cSee https://en.wikipedia.org/wiki/Self-XSS for more information.',
        'color: red; font-size: 16px;'
      );
    }
  }, []);

  return null;
}
