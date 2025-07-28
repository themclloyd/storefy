/**
 * Error filtering utility to suppress known non-critical errors in development
 */

// List of error patterns to suppress in development
const SUPPRESSED_ERROR_PATTERNS = [
  // Browser extension errors
  /Could not establish connection\. Receiving end does not exist/,
  /Extension context invalidated/,
  /chrome-extension:/,
  
  // Media auto-play errors (common in development)
  /The play\(\) request was interrupted/,
  /NotAllowedError.*play/,
  
  // Analytics/tracking errors in localhost
  /Ignoring Event: localhost/,
  /Analytics.*localhost/,
  
  // Service worker errors
  /ServiceWorker.*localhost/,
];

// List of console message patterns to suppress
const SUPPRESSED_CONSOLE_PATTERNS = [
  /Ignoring Event: localhost/,
  /Debug mode is enabled by default in development/,
  /\[Vercel Web Analytics\]/,
  /overrideMethod.*hook\.js/,
  /script\.js.*Ignoring Event/,
];

/**
 * Initialize error filtering for development environment
 */
export function initializeErrorFiltering() {
  if (import.meta.env.NODE_ENV !== 'development') {
    return; // Only filter in development
  }

  // Always filter these common development noise patterns
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // Override console.error to filter extension and media errors
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    const shouldSuppress = SUPPRESSED_ERROR_PATTERNS.some(pattern =>
      pattern.test(message)
    );

    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn to filter React Router warnings
  console.warn = (...args: any[]) => {
    const message = args.join(' ');

    // Suppress React Router hydration warning
    if (message.includes('HydrateFallback') || message.includes('initial hydration')) {
      return;
    }

    const shouldSuppress = SUPPRESSED_ERROR_PATTERNS.some(pattern =>
      pattern.test(message)
    );

    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };

  // Override console.log to filter analytics and tracking messages
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    const shouldSuppress = SUPPRESSED_CONSOLE_PATTERNS.some(pattern =>
      pattern.test(message)
    );

    if (!shouldSuppress) {
      originalLog.apply(console, args);
    }
  };

  // Add global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason || '';
    const shouldSuppress = SUPPRESSED_ERROR_PATTERNS.some(pattern =>
      pattern.test(message)
    );

    if (shouldSuppress) {
      event.preventDefault(); // Prevent the error from showing in console
    }
  });

  // Filter out extension-related errors from the global error handler
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const shouldSuppress = SUPPRESSED_ERROR_PATTERNS.some(pattern =>
      pattern.test(message)
    );

    if (shouldSuppress) {
      event.preventDefault();
    }
  });
}

/**
 * Check if an error should be reported to error tracking services
 */
export function shouldReportError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  return !SUPPRESSED_ERROR_PATTERNS.some(pattern => pattern.test(message));
}
