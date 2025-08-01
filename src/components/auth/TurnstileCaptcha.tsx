import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = ''
}: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const siteKey = import.meta.env.DEV
    ? import.meta.env.VITE_TURNSTILE_SITE_KEY_DEV || '1x00000000000000000000AA'
    : import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    if (!siteKey) {
      console.error('Turnstile site key not configured');
      onError?.('CAPTCHA configuration error');
      return;
    }

    // Check if Turnstile script is already loaded
    if (window.turnstile) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error('Failed to load Turnstile script');
      setIsLoading(false);
      onError?.('Failed to load CAPTCHA');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [siteKey, onError]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) {
      return;
    }

    try {
      // Render Turnstile widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => {
          onVerify(token);
        },
        'error-callback': (error: string) => {
          console.error('Turnstile error:', error);
          onError?.(error);
          toast.error('CAPTCHA verification failed. Please try again.');
        },
        'expired-callback': () => {
          onExpire?.();
          toast.warning('CAPTCHA expired. Please verify again.');
        },
        'timeout-callback': () => {
          onError?.('timeout');
          toast.error('CAPTCHA verification timed out. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error rendering Turnstile:', error);
      onError?.('Failed to render CAPTCHA');
    }

    return () => {
      // Cleanup widget when component unmounts
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Error removing Turnstile widget:', error);
        }
      }
    };
  }, [isLoaded, siteKey, theme, size, onVerify, onError, onExpire]);

  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (error) {
        console.error('Error resetting Turnstile:', error);
      }
    }
  };

  // Expose reset method
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).reset = reset;
    }
  }, []);

  if (!siteKey) {
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/10">
        <p className="text-sm text-destructive">
          CAPTCHA configuration error. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className={`turnstile-container ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading CAPTCHA...
              {isDevelopment && ' (Test Mode)'}
            </span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={isLoading ? 'hidden' : ''}
        style={{ minHeight: size === 'compact' ? '65px' : '65px' }}
      />

      {/* Development mode indicator */}
      {isDevelopment && !isLoading && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
          Development mode: Using Cloudflare test site key
        </p>
      )}
    </div>
  );
}
