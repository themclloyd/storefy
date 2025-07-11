/**
 * CSRF Protection utilities for Storefy
 */

import { secureLog } from './security';

// CSRF token storage key
const CSRF_TOKEN_KEY = 'storefy_csrf_token';
const CSRF_TOKEN_EXPIRY = 'storefy_csrf_expiry';

// Token expiration time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a CSRF token
 */
export function getCSRFToken(): string {
  const existingToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const existingExpiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY);
  
  // Check if token exists and is not expired
  if (existingToken && existingExpiry) {
    const expiryTime = parseInt(existingExpiry, 10);
    if (Date.now() < expiryTime) {
      return existingToken;
    }
  }
  
  // Generate new token
  const newToken = generateSecureToken();
  const newExpiry = Date.now() + TOKEN_EXPIRY_MS;
  
  sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
  sessionStorage.setItem(CSRF_TOKEN_EXPIRY, newExpiry.toString());
  
  secureLog.info('CSRF token generated');
  return newToken;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const storedExpiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY);
  
  if (!storedToken || !storedExpiry) {
    secureLog.warn('CSRF validation failed: No stored token');
    return false;
  }
  
  // Check expiry
  const expiryTime = parseInt(storedExpiry, 10);
  if (Date.now() >= expiryTime) {
    secureLog.warn('CSRF validation failed: Token expired');
    clearCSRFToken();
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (storedToken.length !== token.length) {
    secureLog.warn('CSRF validation failed: Token length mismatch');
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < storedToken.length; i++) {
    result |= storedToken.charCodeAt(i) ^ token.charCodeAt(i);
  }
  
  const isValid = result === 0;
  if (!isValid) {
    secureLog.warn('CSRF validation failed: Token mismatch');
  }
  
  return isValid;
}

/**
 * Clear CSRF token
 */
export function clearCSRFToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
  sessionStorage.removeItem(CSRF_TOKEN_EXPIRY);
  secureLog.info('CSRF token cleared');
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  return {
    ...headers,
    'X-CSRF-Token': token
  };
}

/**
 * CSRF-protected fetch wrapper
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getCSRFToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // If we get a 403, it might be a CSRF issue
  if (response.status === 403) {
    secureLog.warn('Potential CSRF rejection detected', { url, status: response.status });
    clearCSRFToken(); // Clear token to force regeneration
  }
  
  return response;
}

/**
 * React hook for CSRF protection
 */
export function useCSRFProtection() {
  const token = getCSRFToken();
  
  const protectedFetch = async (url: string, options: RequestInit = {}) => {
    return csrfFetch(url, options);
  };
  
  const getProtectedHeaders = (additionalHeaders: Record<string, string> = {}) => {
    return addCSRFHeader(additionalHeaders);
  };
  
  return {
    token,
    protectedFetch,
    getProtectedHeaders,
    validateToken: validateCSRFToken,
    clearToken: clearCSRFToken
  };
}

/**
 * CSRF protection for forms
 */
export function addCSRFToForm(formData: FormData): FormData {
  const token = getCSRFToken();
  formData.append('_csrf_token', token);
  return formData;
}

/**
 * Validate CSRF token from form data
 */
export function validateCSRFFromForm(formData: FormData): boolean {
  const token = formData.get('_csrf_token');
  if (typeof token !== 'string') {
    secureLog.warn('CSRF validation failed: No token in form data');
    return false;
  }
  return validateCSRFToken(token);
}

/**
 * CSRF protection middleware for Supabase calls
 */
export function createCSRFProtectedSupabaseClient(supabaseClient: any) {
  // Create a proxy to intercept Supabase calls and add CSRF protection
  return new Proxy(supabaseClient, {
    get(target, prop) {
      const originalMethod = target[prop];
      
      // Intercept methods that modify data
      if (typeof originalMethod === 'function' && 
          ['insert', 'update', 'upsert', 'delete'].includes(prop as string)) {
        
        return function(...args: any[]) {
          // Add CSRF token to the request context
          const token = getCSRFToken();
          secureLog.info(`CSRF-protected Supabase ${prop as string} call`, { token: token.substring(0, 8) + '...' });
          
          // Call the original method
          return originalMethod.apply(this, args);
        };
      }
      
      return originalMethod;
    }
  });
}

/**
 * Initialize CSRF protection on page load
 */
export function initializeCSRFProtection(): void {
  // Generate initial token
  getCSRFToken();
  
  // Clear token on page unload for security
  window.addEventListener('beforeunload', () => {
    clearCSRFToken();
  });
  
  // Refresh token periodically
  setInterval(() => {
    const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY);
    if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      const timeUntilExpiry = expiryTime - Date.now();
      
      // Refresh token when 10 minutes remaining
      if (timeUntilExpiry < 10 * 60 * 1000) {
        clearCSRFToken();
        getCSRFToken();
        secureLog.info('CSRF token refreshed');
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  secureLog.info('CSRF protection initialized');
}
