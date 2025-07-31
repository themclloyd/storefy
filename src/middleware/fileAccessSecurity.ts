/**
 * File Access Security Middleware
 * Prevents unauthorized access to source files and sensitive resources
 */

/**
 * List of file extensions that should never be served directly
 */
const BLOCKED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.env', '.env.local', '.env.production',
  '.json', '.config.js', '.config.ts',
  '.md', '.txt', '.log',
  '.key', '.pem', '.cert',
  '.sql', '.db', '.sqlite',
  '.backup', '.bak', '.tmp'
];

/**
 * List of directory patterns that should be blocked
 */
const BLOCKED_DIRECTORIES = [
  '/src/', '/components/', '/middleware/', '/lib/',
  '/utils/', '/services/', '/hooks/', '/stores/',
  '/api/', '/scripts/', '/node_modules/',
  '/.git/', '/.env', '/supabase/',
  '/docs/', '/documentation/'
];

/**
 * List of specific files that should be blocked
 */
const BLOCKED_FILES = [
  'package.json', 'package-lock.json',
  'tsconfig.json', 'vite.config.ts',
  'tailwind.config.ts', 'eslint.config.js',
  '.gitignore', '.env', '.env.local',
  'vercel.json', 'components.json'
];

/**
 * Check if a URL path should be blocked for security reasons
 */
export function isBlockedPath(pathname: string): boolean {
  const normalizedPath = pathname.toLowerCase();
  
  // Check for blocked file extensions
  const hasBlockedExtension = BLOCKED_EXTENSIONS.some(ext => 
    normalizedPath.endsWith(ext)
  );
  
  // Check for blocked directories
  const isInBlockedDirectory = BLOCKED_DIRECTORIES.some(dir => 
    normalizedPath.includes(dir)
  );
  
  // Check for specific blocked files
  const isBlockedFile = BLOCKED_FILES.some(file => 
    normalizedPath.endsWith(file.toLowerCase())
  );
  
  // Check for path traversal attempts
  const hasPathTraversal = normalizedPath.includes('../') || 
                          normalizedPath.includes('..\\') ||
                          normalizedPath.includes('%2e%2e');
  
  return hasBlockedExtension || isInBlockedDirectory || isBlockedFile || hasPathTraversal;
}

/**
 * Security headers to add to responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Initialize file access security monitoring
 */
export function initializeFileAccessSecurity(): void {
  // Monitor for suspicious file access attempts
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Check if the request is trying to access blocked content
      if (isBlockedPath(urlObj.pathname)) {
        console.warn('🚨 Security: Blocked attempt to access sensitive file:', urlObj.pathname);
        
        // Log security event
        logSecurityEvent('blocked_file_access', {
          path: urlObj.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer
        });
        
        // Return a 403 Forbidden response
        return new Response('Access Denied', {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'text/plain',
            ...SECURITY_HEADERS
          }
        });
      }
      
      // Proceed with the original request
      const response = await originalFetch.call(this, input, init);
      
      // Add security headers to all responses
      if (response.headers) {
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          if (!response.headers.has(key)) {
            response.headers.set(key, value);
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return originalFetch.call(this, input, init);
    }
  };
  
  console.log('🔒 File access security initialized');
}

/**
 * Log security events for monitoring
 */
function logSecurityEvent(event: string, details: Record<string, any>): void {
  const logEntry = {
    type: 'security_event',
    event,
    details,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // In development, log to console
  if (import.meta.env.DEV) {
    console.warn('🚨 Security Event:', logEntry);
  }
  
  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // Send to your security monitoring service
    // Example: sendToSecurityService(logEntry);
  }
  
  // Store locally for analysis
  try {
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 100 entries
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('security_logs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Failed to store security log:', error);
  }
}

/**
 * Get security logs for analysis
 */
export function getSecurityLogs(): any[] {
  try {
    return JSON.parse(localStorage.getItem('security_logs') || '[]');
  } catch (error) {
    console.error('Failed to retrieve security logs:', error);
    return [];
  }
}

/**
 * Clear security logs
 */
export function clearSecurityLogs(): void {
  try {
    localStorage.removeItem('security_logs');
    console.log('Security logs cleared');
  } catch (error) {
    console.error('Failed to clear security logs:', error);
  }
}

/**
 * Check if current environment is secure
 */
export function isSecureEnvironment(): boolean {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Validate URL for security
 */
export function validateUrl(url: string): { valid: boolean; reason?: string } {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    if (isBlockedPath(urlObj.pathname)) {
      return { valid: false, reason: 'Path contains blocked content' };
    }
    
    // Check for suspicious protocols
    if (!['http:', 'https:', 'data:', 'blob:'].includes(urlObj.protocol)) {
      return { valid: false, reason: 'Unsafe protocol' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}
