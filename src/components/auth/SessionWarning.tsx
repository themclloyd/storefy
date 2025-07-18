import React, { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/sessionManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SessionWarningProps {
  onExtendSession?: () => void;
}

export function SessionWarning({ onExtendSession }: SessionWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(0);

  useEffect(() => {
    const handleSessionWarning = (minutes: number) => {
      setMinutesLeft(minutes);
      setShowWarning(true);
      
      // Show toast notification as well
      toast.warning(`Session expires in ${minutes} minute${minutes !== 1 ? 's' : ''}`, {
        description: 'Click to extend your session',
        action: {
          label: 'Extend',
          onClick: handleExtendSession,
        },
        duration: 30000, // Show for 30 seconds
      });
    };

    const handleSessionExpired = () => {
      setShowWarning(false);
      toast.error('Session expired. Please log in again.');
    };

    sessionManager.onSessionWarning(handleSessionWarning);
    sessionManager.onSessionExpired(handleSessionExpired);

    return () => {
      // Cleanup is handled by sessionManager singleton
    };
  }, []);

  const handleExtendSession = () => {
    sessionManager.refreshSession();
    setShowWarning(false);
    toast.success('Session extended successfully');
    
    if (onExtendSession) {
      onExtendSession();
    }
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-yellow-200 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Session Warning</strong>
              <br />
              Your session expires in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                onClick={handleExtendSession}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Extend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Hook to use session warning functionality
 */
export function useSessionWarning() {
  const [sessionInfo, setSessionInfo] = useState(sessionManager.getSessionInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionInfo(sessionManager.getSessionInfo());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const extendSession = () => {
    sessionManager.refreshSession();
    setSessionInfo(sessionManager.getSessionInfo());
  };

  return {
    sessionInfo,
    extendSession,
    hasValidSession: sessionInfo.hasPinSession,
  };
}
