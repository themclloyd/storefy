import { useEffect } from "react";

interface MobileAppWrapperProps {
  children: React.ReactNode;
}

export function MobileAppWrapper({ children }: MobileAppWrapperProps) {
  useEffect(() => {
    // Add viewport meta tag for mobile optimization
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    // Add apple-mobile-web-app-capable for PWA-like experience
    const appleMeta = document.createElement('meta');
    appleMeta.name = 'apple-mobile-web-app-capable';
    appleMeta.content = 'yes';
    document.head.appendChild(appleMeta);

    // Add apple-mobile-web-app-status-bar-style
    const statusBarMeta = document.createElement('meta');
    statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
    statusBarMeta.content = 'default';
    document.head.appendChild(statusBarMeta);

    // Add theme-color for mobile browsers
    const themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    themeMeta.content = '#ffffff';
    document.head.appendChild(themeMeta);

    // Prevent zoom on input focus on iOS
    const style = document.createElement('style');
    style.innerHTML = `
      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        select,
        textarea,
        input[type="text"],
        input[type="password"],
        input[type="datetime"],
        input[type="datetime-local"],
        input[type="date"],
        input[type="month"],
        input[type="time"],
        input[type="week"],
        input[type="number"],
        input[type="email"],
        input[type="url"],
        input[type="search"],
        input[type="tel"] {
          font-size: 16px;
        }
      }
      
      /* Disable pull-to-refresh */
      body {
        overscroll-behavior-y: contain;
      }
      
      /* Improve touch scrolling on iOS */
      * {
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.head.removeChild(appleMeta);
      document.head.removeChild(statusBarMeta);
      document.head.removeChild(themeMeta);
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
}