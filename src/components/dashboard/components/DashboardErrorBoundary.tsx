import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component for the Dashboard to catch React errors
 */
export class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle className="text-xl">Something went wrong</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    An unexpected error occurred while loading the dashboard.
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="text-left text-xs bg-muted p-2 rounded">
                      <summary className="cursor-pointer font-medium">Error Details</summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.error.message}
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                  <Button onClick={this.handleReset} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
