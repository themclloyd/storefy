/**
 * Enhanced authentication security utilities
 */

import { supabase } from '@/integrations/supabase/client';
import { secureLog, sanitizeError } from './security';

// Account lockout configuration
const LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ATTEMPT_WINDOW: 5 * 60 * 1000, // 5 minutes
  STORAGE_KEY: 'auth_attempts'
};

interface AuthAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ip?: string;
}

interface AccountLockout {
  email: string;
  lockedUntil: number;
  attempts: number;
}

/**
 * Track authentication attempts
 */
export class AuthSecurityManager {
  private attempts: AuthAttempt[] = [];
  private lockouts: Map<string, AccountLockout> = new Map();

  constructor() {
    this.loadFromStorage();
    this.cleanupOldAttempts();
  }

  /**
   * Record an authentication attempt
   */
  recordAttempt(email: string, success: boolean): void {
    const attempt: AuthAttempt = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      success
    };

    this.attempts.push(attempt);
    
    if (!success) {
      this.checkForLockout(email);
    } else {
      // Clear failed attempts on successful login
      this.clearFailedAttempts(email);
    }

    this.saveToStorage();
    secureLog.info('Auth attempt recorded', { email: email.substring(0, 3) + '***', success });
  }

  /**
   * Check if account should be locked out
   */
  private checkForLockout(email: string): void {
    const normalizedEmail = email.toLowerCase();
    const recentAttempts = this.getRecentFailedAttempts(normalizedEmail);

    if (recentAttempts.length >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
      const lockout: AccountLockout = {
        email: normalizedEmail,
        lockedUntil: Date.now() + LOCKOUT_CONFIG.LOCKOUT_DURATION,
        attempts: recentAttempts.length
      };

      this.lockouts.set(normalizedEmail, lockout);
      secureLog.warn('Account locked due to failed attempts', { 
        email: email.substring(0, 3) + '***',
        attempts: recentAttempts.length 
      });
    }
  }

  /**
   * Check if account is currently locked
   */
  isAccountLocked(email: string): boolean {
    const normalizedEmail = email.toLowerCase();
    const lockout = this.lockouts.get(normalizedEmail);

    if (!lockout) return false;

    if (Date.now() > lockout.lockedUntil) {
      // Lockout expired, remove it
      this.lockouts.delete(normalizedEmail);
      this.saveToStorage();
      return false;
    }

    return true;
  }

  /**
   * Get time remaining for lockout
   */
  getLockoutTimeRemaining(email: string): number {
    const normalizedEmail = email.toLowerCase();
    const lockout = this.lockouts.get(normalizedEmail);

    if (!lockout) return 0;

    const remaining = lockout.lockedUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get recent failed attempts for an email
   */
  private getRecentFailedAttempts(email: string): AuthAttempt[] {
    const cutoff = Date.now() - LOCKOUT_CONFIG.ATTEMPT_WINDOW;
    return this.attempts.filter(attempt => 
      attempt.email === email && 
      !attempt.success && 
      attempt.timestamp > cutoff
    );
  }

  /**
   * Clear failed attempts for successful login
   */
  private clearFailedAttempts(email: string): void {
    const normalizedEmail = email.toLowerCase();
    this.attempts = this.attempts.filter(attempt => 
      !(attempt.email === normalizedEmail && !attempt.success)
    );
    this.lockouts.delete(normalizedEmail);
  }

  /**
   * Clean up old attempts
   */
  private cleanupOldAttempts(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.attempts = this.attempts.filter(attempt => attempt.timestamp > cutoff);
    
    // Clean up expired lockouts
    for (const [email, lockout] of this.lockouts.entries()) {
      if (Date.now() > lockout.lockedUntil) {
        this.lockouts.delete(email);
      }
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        attempts: this.attempts,
        lockouts: Array.from(this.lockouts.entries())
      };
      localStorage.setItem(LOCKOUT_CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      secureLog.error('Failed to save auth attempts', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(LOCKOUT_CONFIG.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.attempts = data.attempts || [];
        this.lockouts = new Map(data.lockouts || []);
      }
    } catch (error) {
      secureLog.error('Failed to load auth attempts', error);
      this.attempts = [];
      this.lockouts = new Map();
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    return {
      totalAttempts: this.attempts.length,
      failedAttempts: this.attempts.filter(a => !a.success).length,
      lockedAccounts: this.lockouts.size,
      recentAttempts: this.attempts.filter(a => 
        Date.now() - a.timestamp < 60 * 60 * 1000 // Last hour
      ).length
    };
  }
}

// Global instance
export const authSecurityManager = new AuthSecurityManager();

/**
 * Enhanced sign-in with security checks
 */
export async function secureSignIn(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if account is locked
  if (authSecurityManager.isAccountLocked(normalizedEmail)) {
    const timeRemaining = authSecurityManager.getLockoutTimeRemaining(normalizedEmail);
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
    
    secureLog.warn('Sign-in attempt on locked account', { 
      email: normalizedEmail.substring(0, 3) + '***' 
    });
    
    throw new Error(`Account temporarily locked. Try again in ${minutesRemaining} minutes.`);
  }

  try {
    const result = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    // Record the attempt
    authSecurityManager.recordAttempt(normalizedEmail, !result.error);

    if (result.error) {
      secureLog.warn('Sign-in failed', { 
        email: normalizedEmail.substring(0, 3) + '***',
        error: sanitizeError(result.error)
      });
      throw new Error(sanitizeError(result.error));
    }

    secureLog.info('Sign-in successful', { 
      email: normalizedEmail.substring(0, 3) + '***' 
    });

    return result;
  } catch (error) {
    // Record failed attempt
    authSecurityManager.recordAttempt(normalizedEmail, false);
    throw error;
  }
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Password must be at least 8 characters long');

  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Common password patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 2;
    feedback.push('Avoid common password patterns');
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }

  const isValid = score >= 4 && password.length >= 8;

  return {
    isValid,
    score: Math.max(0, Math.min(6, score)),
    feedback
  };
}

/**
 * Check for compromised passwords (basic implementation)
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  try {
    // In a real implementation, you would use HaveIBeenPwned API
    // For now, just check against common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
    ];

    return commonPasswords.includes(password.toLowerCase());
  } catch (error) {
    secureLog.error('Failed to check password compromise status', error);
    return false; // Fail open for availability
  }
}

/**
 * MFA enforcement utilities
 */
export async function checkMFARequired(userId: string): Promise<boolean> {
  try {
    // Check if user has admin role or handles sensitive data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: storeMembers } = await supabase
      .from('store_members')
      .select('role')
      .eq('user_id', userId);

    // Require MFA for store owners and managers
    const hasAdminRole = storeMembers?.some(member =>
      member.role === 'owner' || member.role === 'manager'
    );

    return hasAdminRole || false;
  } catch (error) {
    secureLog.error('Failed to check MFA requirements', error);
    return false;
  }
}

/**
 * Email verification for sensitive operations
 */
export async function requireEmailVerification(operation: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      secureLog.warn('Email verification required for sensitive operation', {
        operation,
        userId: user.id
      });
      throw new Error('Please verify your email address before performing this action.');
    }

    return true;
  } catch (error) {
    secureLog.error('Email verification check failed', error);
    throw error;
  }
}

/**
 * Session security validation
 */
export function validateSessionSecurity(): boolean {
  try {
    const sessionData = localStorage.getItem('supabase.auth.token');
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    const now = Date.now() / 1000;

    // Check if session is expired
    if (session.expires_at && session.expires_at < now) {
      secureLog.warn('Expired session detected');
      return false;
    }

    // Check session age (force re-auth after 24 hours)
    const sessionAge = now - (session.created_at || 0);
    const maxSessionAge = 24 * 60 * 60; // 24 hours

    if (sessionAge > maxSessionAge) {
      secureLog.warn('Session too old, requiring re-authentication');
      return false;
    }

    return true;
  } catch (error) {
    secureLog.error('Session validation failed', error);
    return false;
  }
}
