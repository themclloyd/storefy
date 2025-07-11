import React, { createContext, useContext, useEffect, useState } from 'react';
import { secureLog, rateLimiter, secureStorage, SESSION_CONFIG } from '@/lib/security';

interface SecurityContextType {
  isRateLimited: (key: string, maxRequests?: number, windowMs?: number) => boolean;
  clearRateLimit: (key: string) => void;
  secureStore: typeof secureStorage;
  reportSecurityEvent: (event: string, details?: any) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [securityEvents, setSecurityEvents] = useState<Array<{ event: string; timestamp: number; details?: any }>>([]);

  useEffect(() => {
    // Set up security monitoring
    const handleSecurityEvent = (event: string, details?: any) => {
      const securityEvent = {
        event,
        timestamp: Date.now(),
        details
      };
      
      setSecurityEvents(prev => [...prev.slice(-99), securityEvent]); // Keep last 100 events
      secureLog.warn(`Security Event: ${event}`, details);
    };

    // Monitor for suspicious activity
    const monitorSuspiciousActivity = () => {
      // Check for rapid page navigation (potential bot activity)
      let navigationCount = 0;
      const resetNavigationCount = () => { navigationCount = 0; };
      
      const handleNavigation = () => {
        navigationCount++;
        if (navigationCount > 10) {
          handleSecurityEvent('rapid_navigation', { count: navigationCount });
        }
      };

      window.addEventListener('beforeunload', handleNavigation);
      const navigationTimer = setInterval(resetNavigationCount, 60000); // Reset every minute

      // Monitor for console access (potential developer tools usage)
      let devToolsOpen = false;
      const checkDevTools = () => {
        const threshold = 160;
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devToolsOpen) {
            devToolsOpen = true;
            handleSecurityEvent('dev_tools_detected');
          }
        } else {
          devToolsOpen = false;
        }
      };

      const devToolsTimer = setInterval(checkDevTools, 1000);

      // Cleanup
      return () => {
        window.removeEventListener('beforeunload', handleNavigation);
        clearInterval(navigationTimer);
        clearInterval(devToolsTimer);
      };
    };

    const cleanup = monitorSuspiciousActivity();

    // Session timeout monitoring
    const checkSessionTimeout = () => {
      const pinSession = secureStorage.get(SESSION_CONFIG.PIN_SESSION_KEY);
      if (pinSession && pinSession.login_time) {
        const loginTime = new Date(pinSession.login_time).getTime();
        const now = Date.now();
        
        if (now - loginTime > SESSION_CONFIG.TIMEOUT) {
          secureStorage.remove(SESSION_CONFIG.PIN_SESSION_KEY);
          handleSecurityEvent('session_timeout', { type: 'pin_session' });
          window.location.href = '/auth';
        }
      }
    };

    const sessionTimer = setInterval(checkSessionTimeout, 60000); // Check every minute

    return () => {
      cleanup();
      clearInterval(sessionTimer);
    };
  }, []);

  const isRateLimited = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
    return !rateLimiter.isAllowed(key, maxRequests, windowMs);
  };

  const clearRateLimit = (key: string) => {
    rateLimiter.reset(key);
  };

  const reportSecurityEvent = (event: string, details?: any) => {
    const securityEvent = {
      event,
      timestamp: Date.now(),
      details
    };
    
    setSecurityEvents(prev => [...prev.slice(-99), securityEvent]);
    secureLog.warn(`Security Event: ${event}`, details);
  };

  const value = {
    isRateLimited,
    clearRateLimit,
    secureStore: secureStorage,
    reportSecurityEvent
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// Security hook for API calls
export function useSecureApiCall() {
  const { isRateLimited, reportSecurityEvent } = useSecurity();

  const secureApiCall = async <T,>(
    apiCall: () => Promise<T>,
    rateLimitKey: string,
    maxRequests: number = 10,
    windowMs: number = 60000
  ): Promise<T> => {
    // Check rate limiting
    if (isRateLimited(rateLimitKey, maxRequests, windowMs)) {
      reportSecurityEvent('rate_limit_exceeded', { key: rateLimitKey });
      throw new Error('Too many requests. Please try again later.');
    }

    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      // Log security-relevant errors
      if (error instanceof Error) {
        if (error.message.includes('auth') || error.message.includes('permission')) {
          reportSecurityEvent('api_auth_error', { error: error.message });
        }
      }
      throw error;
    }
  };

  return { secureApiCall };
}
