/**
 * Security utilities and configurations for Storefy
 */
import DOMPurify from 'dompurify';

// Environment-based logging
export const secureLog = {
  info: (message: string, data?: any) => {
    if (import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true' || import.meta.env.DEV) {
      console.log(message, data);
    }
  },
  warn: (message: string, data?: any) => {
    if (import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true' || import.meta.env.DEV) {
      console.warn(message, data);
    }
  },
  error: (message: string, data?: any) => {
    // Always log errors, but sanitize in production
    if (import.meta.env.DEV) {
      console.error(message, data);
    } else {
      console.error(message);
    }
  }
};

// Enhanced input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove VBScript
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
};

// Enhanced HTML sanitization using DOMPurify
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  });
};

// Sanitize for display in text content (no HTML allowed)
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

// Sanitize URLs
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  // Allow only http, https, and mailto protocols
  const allowedProtocols = /^(https?|mailto):/i;

  try {
    const urlObj = new URL(url);
    if (!allowedProtocols.test(urlObj.protocol)) {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
};

// Session security
export const SESSION_CONFIG = {
  TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600') * 1000, // Convert to ms
  STORAGE_KEY: 'storefy_session',
  PIN_SESSION_KEY: 'pin_session'
};

// Secure session storage
export const secureStorage = {
  set: (key: string, value: any) => {
    try {
      const encrypted = btoa(JSON.stringify({
        data: value,
        timestamp: Date.now(),
        expires: Date.now() + SESSION_CONFIG.TIMEOUT
      }));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      secureLog.error('Failed to store session data', error);
    }
  },
  
  get: (key: string) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const decoded = JSON.parse(atob(stored));
      
      // Check if expired
      if (Date.now() > decoded.expires) {
        localStorage.removeItem(key);
        return null;
      }
      
      return decoded.data;
    } catch (error) {
      secureLog.error('Failed to retrieve session data', error);
      localStorage.removeItem(key);
      return null;
    }
  },
  
  remove: (key: string) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    localStorage.removeItem(SESSION_CONFIG.PIN_SESSION_KEY);
  }
};

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  reset(key: string) {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Error sanitization for production
export const sanitizeError = (error: any): string => {
  if (import.meta.env.DEV) {
    return error?.message || 'An error occurred';
  }
  
  // In production, return generic messages
  const genericMessages: Record<string, string> = {
    'auth': 'Authentication failed',
    'network': 'Network error occurred',
    'validation': 'Invalid input provided',
    'permission': 'Access denied',
    'default': 'An unexpected error occurred'
  };
  
  const errorType = error?.code || error?.type || 'default';
  return genericMessages[errorType] || genericMessages.default;
};

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "https://irmuaqhwmtgbkftqlohx.supabase.co"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://irmuaqhwmtgbkftqlohx.supabase.co", "wss://irmuaqhwmtgbkftqlohx.supabase.co"],
  'font-src': ["'self'"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'frame-src': ["'none'"]
};

// Security headers for development reference
export const SECURITY_HEADERS = {
  'Content-Security-Policy': Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
