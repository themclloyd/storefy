/**
 * Security middleware for 2025 standards
 * Implements security headers, request validation, and protection mechanisms
 */

import { CSRFProtection, XSSProtection, RateLimiter } from '@/utils/security';
import { initializeFileAccessSecurity } from './fileAccessSecurity';

// Security headers configuration
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Strict transport security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  
  // Cross-origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/**
 * Initialize security measures for the application
 */
export function initializeSecurity(): void {
  // Set up CSRF protection
  setupCSRFProtection();

  // Set up XSS protection
  setupXSSProtection();

  // Set up file access security
  initializeFileAccessSecurity();

  // Set up secure headers (for development - in production use server config)
  if (import.meta.env.DEV) {
    setupSecurityHeaders();
  }

  // Set up input sanitization
  setupInputSanitization();

  console.log('🔒 Security measures initialized');
}

/**
 * Set up CSRF protection
 */
function setupCSRFProtection(): void {
  // Generate and store CSRF token on app initialization
  const token = CSRFProtection.generateToken();
  CSRFProtection.storeToken(token);
  
  // Add CSRF token to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = CSRFProtection.addTokenToHeaders(init?.headers as Record<string, string>);
    
    return originalFetch(input, {
      ...init,
      headers,
    });
  };
}

/**
 * Set up XSS protection
 */
function setupXSSProtection(): void {
  // Override innerHTML to sanitize content
  const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  
  if (originalInnerHTML) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      get: originalInnerHTML.get,
      set(value: string) {
        const sanitized = XSSProtection.sanitizeHTML(value);
        originalInnerHTML.set?.call(this, sanitized);
      },
      configurable: true,
    });
  }
}

/**
 * Set up security headers (development only)
 */
function setupSecurityHeaders(): void {
  // Note: In production, these should be set by the server/CDN
  // Disable CSP in development to avoid blocking Supabase and other services
  console.log('🔒 CSP disabled in development for compatibility');
}

/**
 * Set up input sanitization for forms
 */
function setupInputSanitization(): void {
  // Add event listener for all form inputs
  document.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Sanitize input value
      const sanitized = XSSProtection.sanitizeInput(target.value);
      if (sanitized !== target.value) {
        target.value = sanitized;
      }
    }
  });
}

/**
 * Secure API request wrapper
 */
export class SecureAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...CSRFProtection.addTokenToHeaders(),
    };
  }

  /**
   * Make a secure GET request
   */
  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.request('GET', endpoint, options);
  }

  /**
   * Make a secure POST request
   */
  async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.request('POST', endpoint, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a secure PUT request
   */
  async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.request('PUT', endpoint, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a secure DELETE request
   */
  async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.request('DELETE', endpoint, options);
  }

  /**
   * Internal request method with security measures
   */
  private async request(method: string, endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Check rate limiting
    const rateLimitKey = `${method}:${endpoint}`;
    if (RateLimiter.isRateLimited(rateLimitKey)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Merge headers with security headers
    const headers = {
      ...this.defaultHeaders,
      ...CSRFProtection.addTokenToHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'same-origin', // Include cookies for same-origin requests
      });

      // Clear rate limit on successful request
      if (response.ok) {
        RateLimiter.clearRateLimit(rateLimitKey);
      }

      return response;
    } catch (error) {
      console.error(`Secure API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }
}

/**
 * Secure form validation middleware
 */
export class SecureFormValidator {
  /**
   * Validate and sanitize form data
   */
  static validateFormData(formData: FormData): Record<string, string> {
    const sanitizedData: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        // Sanitize the value
        sanitizedData[key] = XSSProtection.sanitizeInput(value);
      }
    }

    return sanitizedData;
  }

  /**
   * Validate file uploads
   */
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/json',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file name for malicious patterns
    const maliciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.php$/i,
    ];

    if (maliciousPatterns.some(pattern => pattern.test(file.name))) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  }
}

/**
 * Security event logger
 */
export class SecurityLogger {
  /**
   * Log security events
   */
  static logSecurityEvent(event: string, details: Record<string, any> = {}): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In production, send to security monitoring service
    if (import.meta.env.PROD) {
      // Send to monitoring service
      console.warn('Security Event:', logEntry);
    } else {
      console.log('Security Event:', logEntry);
    }
  }

  /**
   * Log authentication events
   */
  static logAuthEvent(action: string, success: boolean, details: Record<string, any> = {}): void {
    this.logSecurityEvent('auth', {
      action,
      success,
      ...details,
    });
  }

  /**
   * Log suspicious activity
   */
  static logSuspiciousActivity(activity: string, details: Record<string, any> = {}): void {
    this.logSecurityEvent('suspicious_activity', {
      activity,
      ...details,
    });
  }
}
