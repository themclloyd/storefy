import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Crown,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemAdminAuthProps {
  onAuthenticated: () => void;
  onCancel: () => void;
}

// Default system admin credentials (should be changed after first login)
const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'sysadmin@storefy.local',
  password: 'Storefy@Admin2024!'
};

export function SystemAdminAuth({ onAuthenticated, onCancel }: SystemAdminAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check against default admin credentials
      if (email === DEFAULT_ADMIN_CREDENTIALS.email && password === DEFAULT_ADMIN_CREDENTIALS.password) {
        // Store admin session
        sessionStorage.setItem('system_admin_session', JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          email: email,
          isDefaultCredentials: true
        }));
        
        toast.success('System admin access granted');
        onAuthenticated();
        return;
      }

      // Check against custom admin credentials stored in localStorage
      const customCredentials = localStorage.getItem('storefy_admin_credentials');
      if (customCredentials) {
        const { email: customEmail, password: customPassword } = JSON.parse(customCredentials);
        if (email === customEmail && password === customPassword) {
          sessionStorage.setItem('system_admin_session', JSON.stringify({
            authenticated: true,
            timestamp: Date.now(),
            email: email,
            isDefaultCredentials: false
          }));
          
          toast.success('System admin access granted');
          onAuthenticated();
          return;
        }
      }

      // Invalid credentials
      setAttempts(prev => prev + 1);
      setError('Invalid system administrator credentials');
      
      // Lock out after 3 failed attempts
      if (attempts >= 2) {
        setError('Too many failed attempts. Access temporarily locked.');
        setTimeout(() => {
          setAttempts(0);
          setError('');
        }, 30000); // 30 second lockout
      }

    } catch (error) {
      console.error('System admin auth error:', error);
      setError('Authentication system error');
    } finally {
      setLoading(false);
    }
  };

  const isLockedOut = attempts >= 3;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md border-red-200 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-red-100 rounded-full w-fit">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-red-800">
              System Administrator Access
            </CardTitle>
            <p className="text-sm text-red-600 mt-2">
              Restricted area - Authorized personnel only
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Warning */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> This area provides full system access. 
              All activities are logged and monitored.
            </AlertDescription>
          </Alert>

          {/* Default Credentials Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <KeyRound className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Default Credentials:</strong><br />
              Email: <code className="bg-blue-100 px-1 rounded">sysadmin@storefy.local</code><br />
              Password: <code className="bg-blue-100 px-1 rounded">Storefy@Admin2024!</code><br />
              <em className="text-xs">Change these after first login!</em>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Administrator Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
                disabled={loading || isLockedOut}
                className="border-red-200 focus:border-red-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Administrator Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  disabled={loading || isLockedOut}
                  className="border-red-200 focus:border-red-400 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isLockedOut}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading || isLockedOut || !email || !password}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Access System
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Cancel
              </Button>
            </div>
          </form>

          {attempts > 0 && attempts < 3 && (
            <p className="text-xs text-red-600 text-center">
              Failed attempts: {attempts}/3
            </p>
          )}

          {isLockedOut && (
            <p className="text-xs text-red-600 text-center">
              Access locked for 30 seconds due to failed attempts
            </p>
          )}

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>🔒 All access attempts are logged</p>
            <p>🛡️ Unauthorized access is prohibited</p>
            <p>📞 Contact IT support for assistance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility function to check if admin is authenticated
export function isSystemAdminAuthenticated(): boolean {
  const session = sessionStorage.getItem('system_admin_session');
  if (!session) return false;

  try {
    const { authenticated, timestamp } = JSON.parse(session);
    const now = Date.now();
    const sessionAge = now - timestamp;
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours

    return authenticated && sessionAge < maxAge;
  } catch {
    return false;
  }
}

// Utility function to clear admin session
export function clearSystemAdminSession(): void {
  sessionStorage.removeItem('system_admin_session');
}

// Utility function to get admin session info
export function getSystemAdminSession(): { email: string; isDefaultCredentials: boolean } | null {
  const session = sessionStorage.getItem('system_admin_session');
  if (!session) return null;

  try {
    const sessionData = JSON.parse(session);
    return {
      email: sessionData.email,
      isDefaultCredentials: sessionData.isDefaultCredentials
    };
  } catch {
    return null;
  }
}
