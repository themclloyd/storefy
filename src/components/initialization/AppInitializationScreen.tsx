import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppInitialization, InitializationPhase } from '@/contexts/AppInitializationContext';

const phaseMessages: Record<InitializationPhase, { title: string; description: string; progress: number }> = {
  starting: {
    title: 'Starting Storefy',
    description: 'Initializing application...',
    progress: 10,
  },
  'checking-auth': {
    title: 'Checking Authentication',
    description: 'Verifying your session...',
    progress: 30,
  },
  'checking-pin': {
    title: 'Checking Access',
    description: 'Determining access method...',
    progress: 50,
  },
  'loading-stores': {
    title: 'Loading Stores',
    description: 'Fetching your store data...',
    progress: 70,
  },
  'restoring-state': {
    title: 'Restoring Session',
    description: 'Restoring your previous selections...',
    progress: 90,
  },
  ready: {
    title: 'Ready',
    description: 'Welcome to Storefy!',
    progress: 100,
  },
  error: {
    title: 'Initialization Failed',
    description: 'Something went wrong during startup',
    progress: 0,
  },
};

export function AppInitializationScreen() {
  const { appState, retryInitialization, isInitializing } = useAppInitialization();
  const { phase, error } = appState;

  const currentPhase = phaseMessages[phase];

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">{currentPhase.title}</CardTitle>
            <p className="text-muted-foreground">{currentPhase.description}</p>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">
                {error}
              </p>
            )}
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={retryInitialization} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Initialization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>{currentPhase.title}</CardTitle>
          <p className="text-muted-foreground">{currentPhase.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{currentPhase.progress}%</span>
            </div>
            <Progress value={currentPhase.progress} className="w-full" />
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Please wait...</span>
          </div>

          {/* Phase-specific details */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            {phase === 'checking-auth' && (
              <p>Checking for existing sessions...</p>
            )}
            {phase === 'checking-pin' && (
              <p>Validating access credentials...</p>
            )}
            {phase === 'loading-stores' && (
              <p>Fetching store information...</p>
            )}
            {phase === 'restoring-state' && (
              <p>Restoring your workspace...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simplified loading component for quick transitions
export function AppLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Hook for components that need to show loading state
export function useInitializationLoading() {
  const { isInitializing, appState } = useAppInitialization();
  
  return {
    isLoading: isInitializing,
    phase: appState.phase,
    shouldShowFullScreen: isInitializing && appState.phase !== 'ready',
    shouldShowSpinner: isInitializing && appState.phase === 'ready',
  };
}
