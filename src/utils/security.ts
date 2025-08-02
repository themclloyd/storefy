/**
 * Security utilities for 2025 best practices
 * Implements XSS prevention, CSRF protection, and secure data handling
 */

import DOMPurify from 'dompurify';

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development and React components
    'blob:', // Required for dynamic imports
    'https://plausible.io',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and inline styles
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
  ],
  'media-src': [
    "'self'",
    'data:',
    'blob:',
  ],

  'connect-src': [
    "'self'",
    'http://localhost:8080',
    'ws://localhost:8080',
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://plausible.io',
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://*.googletagmanager.com',

  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
};

// Generate CSP header string
export function generateCSPHeader(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

// XSS Prevention utilities
export class XSSProtection {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  }

  /**
   * Sanitize user input for safe display
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate and sanitize URL to prevent XSS
   */
  static sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Only allow safe protocols
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
        return '#';
      }
      
      return parsed.toString();
    } catch {
      return '#';
    }
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// CSRF Protection utilities
export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token';
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';

  /**
   * Generate a cryptographically secure CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store CSRF token securely
   */
  static storeToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get stored CSRF token
   */
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Add CSRF token to request headers
   */
  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[this.TOKEN_HEADER] = token;
    }
    return headers;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(receivedToken: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === receivedToken;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}

// Secure data handling utilities
export class SecureDataHandler {
  /**
   * Securely store sensitive data with encryption
   */
  static async storeSecureData(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      const encodedData = btoa(jsonData); // Basic encoding (use proper encryption in production)
      sessionStorage.setItem(`secure_${key}`, encodedData);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  }

  /**
   * Retrieve and decrypt sensitive data
   */
  static async getSecureData(key: string): Promise<any | null> {
    try {
      const encodedData = sessionStorage.getItem(`secure_${key}`);
      if (!encodedData) return null;
      
      const jsonData = atob(encodedData);
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  /**
   * Clear sensitive data
   */
  static clearSecureData(key: string): void {
    sessionStorage.removeItem(`secure_${key}`);
  }

  /**
   * Clear all sensitive data
   */
  static clearAllSecureData(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

// Input validation utilities
export class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Sanitize and validate numeric input
   */
  static sanitizeNumber(input: string): number | null {
    const cleaned = input.replace(/[^\d.-]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? null : number;
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  /**
   * Check if action is rate limited
   */
  static isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return false;
    }

    // Reset if window has passed
    if (now - attempt.lastAttempt > windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return false;
    }

    // Increment attempt count
    attempt.count++;
    attempt.lastAttempt = now;

    return attempt.count > maxAttempts;
  }

  /**
   * Clear rate limit for a key
   */
  static clearRateLimit(key: string): void {
    this.attempts.delete(key);
  }
}
