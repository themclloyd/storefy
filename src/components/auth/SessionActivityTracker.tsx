import { useEffect, useRef } from 'react';
import { sessionManager } from '@/lib/sessionManager';

interface SessionActivityTrackerProps {
  children: React.ReactNode;
  activityThreshold?: number; // milliseconds of inactivity before considering user idle
  extendOnActivity?: boolean; // whether to extend session on user activity
}

/**
 * Component that tracks user activity and manages session extension
 * This should wrap your main application content
 */
export function SessionActivityTracker({ 
  children, 
  activityThreshold = 30000, // 30 seconds default
  extendOnActivity = true 
}: SessionActivityTrackerProps) {
  const lastActivityRef = useRef<number>(Date.now());
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!extendOnActivity) return;

    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'blur'
    ];

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only update if enough time has passed to avoid excessive calls
      if (timeSinceLastActivity >= activityThreshold) {
        lastActivityRef.current = now;
        
        // Extend session if user has a valid PIN session
        const pinSession = sessionManager.getPinSession();
        if (pinSession) {
          sessionManager.refreshSession();
        }
      }

      // Reset the idle timer
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }

      // Set a new idle timer
      activityTimerRef.current = setTimeout(() => {
        // User has been idle for the threshold period
        // You could implement idle-specific logic here if needed
      }, activityThreshold);
    };

    // Add event listeners with passive option for better performance
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial activity registration
    handleActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, [activityThreshold, extendOnActivity]);

  return <>{children}</>;
}

/**
 * Hook for manual session activity tracking
 */
export function useSessionActivity() {
  const registerActivity = () => {
    const pinSession = sessionManager.getPinSession();
    if (pinSession) {
      sessionManager.refreshSession();
    }
  };

  const getSessionInfo = () => {
    return sessionManager.getSessionInfo();
  };

  const isSessionValid = () => {
    return sessionManager.getPinSession() !== null;
  };

  return {
    registerActivity,
    getSessionInfo,
    isSessionValid,
  };
}

/**
 * Higher-order component for wrapping components with session activity tracking
 */
export function withSessionTracking<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    activityThreshold?: number;
    extendOnActivity?: boolean;
  }
) {
  return function SessionTrackedComponent(props: P) {
    return (
      <SessionActivityTracker {...options}>
        <Component {...props} />
      </SessionActivityTracker>
    );
  };
}
