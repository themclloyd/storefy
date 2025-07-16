import React, { useState } from 'react';
import { useSecureAction, usePermission } from '@/hooks/useRoleBasedAccess';
import { Permission } from '@/contexts/PermissionContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SecureActionProps {
  permission: Permission;
  children: React.ReactNode;
  onUnauthorized?: () => void;
  showUnauthorizedMessage?: boolean;
  fallbackComponent?: React.ReactNode;
}

/**
 * Component that renders children only if user has the required permission
 */
export function SecureAction({ 
  permission, 
  children, 
  onUnauthorized,
  showUnauthorizedMessage = false,
  fallbackComponent 
}: SecureActionProps) {
  const { hasPermission, loading } = usePermission(permission);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!hasPermission) {
    if (onUnauthorized) {
      onUnauthorized();
    }

    if (showUnauthorizedMessage) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have permission to perform this action.
          </AlertDescription>
        </Alert>
      );
    }

    return fallbackComponent || null;
  }

  return <>{children}</>;
}

interface SecureButtonProps {
  permission: Permission;
  onClick: () => Promise<void> | void;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  showUnauthorizedToast?: boolean;
}

/**
 * Button component that checks permissions before executing action
 */
export function SecureButton({
  permission,
  onClick,
  children,
  variant = "default",
  size = "default",
  className,
  disabled = false,
  showUnauthorizedToast = true,
  ...props
}: SecureButtonProps) {
  const { executeWithPermission } = useSecureAction();
  const { hasPermission, loading } = usePermission(permission);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleClick = async () => {
    if (!hasPermission) {
      if (showUnauthorizedToast) {
        toast.error('You don\'t have permission to perform this action');
      }
      return;
    }

    setIsExecuting(true);
    try {
      await executeWithPermission(
        permission,
        onClick,
        () => {
          if (showUnauthorizedToast) {
            toast.error('Unauthorized action attempt');
          }
        }
      );
    } catch (error) {
      console.error('Error executing secure action:', error);
      toast.error('Failed to execute action');
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className} {...props}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (!hasPermission) {
    return null; // Hide button if no permission
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isExecuting}
      onClick={handleClick}
      {...props}
    >
      {isExecuting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {children}
    </Button>
  );
}

interface SecureFormProps {
  permission: Permission;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Form component that checks permissions before submission
 */
export function SecureForm({ permission, onSubmit, children, className }: SecureFormProps) {
  const { executeWithPermission } = useSecureAction();
  const { hasPermission, loading } = usePermission(permission);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission) {
      toast.error('You don\'t have permission to submit this form');
      return;
    }

    setIsSubmitting(true);
    try {
      await executeWithPermission(
        permission,
        () => onSubmit(e),
        () => toast.error('Unauthorized form submission attempt')
      );
    } catch (error) {
      console.error('Error submitting secure form:', error);
      toast.error('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          You don't have permission to access this form.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <fieldset disabled={isSubmitting}>
        {children}
      </fieldset>
    </form>
  );
}

interface SecureFieldProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders form fields based on permissions
 */
export function SecureField({ permission, children, fallback }: SecureFieldProps) {
  const { hasPermission, loading } = usePermission(permission);

  if (loading) {
    return <div className="h-10 bg-muted animate-pulse rounded" />;
  }

  if (!hasPermission) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface SecureDataProps {
  permission: Permission;
  data: any;
  children: (data: any) => React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Component that conditionally renders data based on permissions
 */
export function SecureData({ 
  permission, 
  data, 
  children, 
  fallback,
  loadingComponent 
}: SecureDataProps) {
  const { hasPermission, loading } = usePermission(permission);

  if (loading) {
    return loadingComponent || <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!hasPermission) {
    return fallback || (
      <div className="text-muted-foreground text-sm">
        [Protected Data]
      </div>
    );
  }

  return <>{children(data)}</>;
}

// Higher-order component for securing entire components
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission
) {
  return function SecuredComponent(props: P) {
    return (
      <SecureAction permission={permission}>
        <Component {...props} />
      </SecureAction>
    );
  };
}
