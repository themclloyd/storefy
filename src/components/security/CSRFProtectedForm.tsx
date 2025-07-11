import React, { FormEvent, ReactNode } from 'react';
import { useCSRFProtection } from '@/lib/csrf';
import { secureLog } from '@/lib/security';

interface CSRFProtectedFormProps {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>, csrfToken: string) => void | Promise<void>;
  className?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  action?: string;
  encType?: string;
}

/**
 * Form component with built-in CSRF protection
 */
export function CSRFProtectedForm({
  children,
  onSubmit,
  className,
  method = 'POST',
  action,
  encType = 'application/x-www-form-urlencoded'
}: CSRFProtectedFormProps) {
  const { token, validateToken } = useCSRFProtection();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate CSRF token before submission
    if (!validateToken(token)) {
      secureLog.warn('Form submission blocked: Invalid CSRF token');
      throw new Error('Security validation failed. Please refresh the page and try again.');
    }
    
    secureLog.info('CSRF-protected form submission');
    await onSubmit(event, token);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      method={method}
      action={action}
      encType={encType}
    >
      {/* Hidden CSRF token field */}
      <input
        type="hidden"
        name="_csrf_token"
        value={token}
        readOnly
      />
      
      {children}
    </form>
  );
}

/**
 * Hook for adding CSRF protection to existing forms
 */
export function useCSRFForm() {
  const { token, validateToken, getProtectedHeaders } = useCSRFProtection();

  const getCSRFInput = () => (
    <input
      key="csrf-token"
      type="hidden"
      name="_csrf_token"
      value={token}
      readOnly
    />
  );

  const validateFormSubmission = (formData: FormData): boolean => {
    const submittedToken = formData.get('_csrf_token');
    if (typeof submittedToken !== 'string') {
      secureLog.warn('CSRF validation failed: No token in form');
      return false;
    }
    return validateToken(submittedToken);
  };

  const protectedSubmit = async (
    submitFunction: (formData: FormData) => Promise<void>,
    formData: FormData
  ): Promise<void> => {
    if (!validateFormSubmission(formData)) {
      throw new Error('Security validation failed. Please refresh the page and try again.');
    }
    
    secureLog.info('CSRF-protected form submission via hook');
    await submitFunction(formData);
  };

  return {
    token,
    getCSRFInput,
    validateFormSubmission,
    protectedSubmit,
    getProtectedHeaders
  };
}

/**
 * Higher-order component for CSRF protection
 */
export function withCSRFProtection<P extends object>(
  WrappedComponent: React.ComponentType<P & { csrfToken: string }>
) {
  return function CSRFProtectedComponent(props: P) {
    const { token } = useCSRFProtection();
    
    return <WrappedComponent {...props} csrfToken={token} />;
  };
}

/**
 * CSRF token display component (for debugging)
 */
export function CSRFTokenDisplay() {
  const { token } = useCSRFProtection();
  
  if (!import.meta.env.DEV) {
    return null; // Don't show in production
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-xs font-mono">
      <div className="font-bold">CSRF Token (Dev Only):</div>
      <div className="break-all">{token.substring(0, 16)}...</div>
    </div>
  );
}
