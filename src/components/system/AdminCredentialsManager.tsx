import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { getSystemAdminSession } from './SystemAdminAuth';

export function AdminCredentialsManager() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const adminSession = getSystemAdminSession();
  const isUsingDefaultCredentials = adminSession?.isDefaultCredentials ?? false;

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate current password if not using default credentials
      if (!isUsingDefaultCredentials) {
        const customCredentials = localStorage.getItem('storefy_admin_credentials');
        if (customCredentials) {
          const { password: storedPassword } = JSON.parse(customCredentials);
          if (currentPassword !== storedPassword) {
            toast.error('Current password is incorrect');
            setLoading(false);
            return;
          }
        }
      } else {
        // For default credentials, verify current password
        if (currentPassword !== 'Storefy@Admin2024!') {
          toast.error('Current password is incorrect');
          setLoading(false);
          return;
        }
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        toast.error('Password requirements not met');
        setLoading(false);
        return;
      }

      // Check password confirmation
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        setLoading(false);
        return;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Save new credentials
      const newCredentials = {
        email: newEmail,
        password: newPassword,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('storefy_admin_credentials', JSON.stringify(newCredentials));

      // Update current session
      sessionStorage.setItem('system_admin_session', JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
        email: newEmail,
        isDefaultCredentials: false
      }));

      // Clear form
      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success('Admin credentials updated successfully');

    } catch (error) {
      console.error('Error updating credentials:', error);
      toast.error('Failed to update credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to reset to default credentials? This will remove your custom credentials.')) {
      localStorage.removeItem('storefy_admin_credentials');
      
      // Update session to default
      sessionStorage.setItem('system_admin_session', JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
        email: 'sysadmin@storefy.local',
        isDefaultCredentials: true
      }));

      toast.success('Credentials reset to default');
    }
  };

  const passwordValidation = validatePassword(newPassword);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Admin Credentials Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Current Admin Account</p>
              <p className="text-sm text-muted-foreground">{adminSession?.email}</p>
            </div>
            <Badge variant={isUsingDefaultCredentials ? "destructive" : "default"}>
              {isUsingDefaultCredentials ? "Default Credentials" : "Custom Credentials"}
            </Badge>
          </div>

          {/* Security Warning for Default Credentials */}
          {isUsingDefaultCredentials && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Security Risk:</strong> You are using default credentials. 
                Please change them immediately for security purposes.
              </AlertDescription>
            </Alert>
          )}

          {/* Change Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">New Admin Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new admin email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
              />
              
              {/* Password Requirements */}
              {newPassword && (
                <div className="space-y-1 text-xs">
                  {passwordValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      {error}
                    </div>
                  ))}
                  {passwordValidation.isValid && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Password meets all requirements
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={
                  loading || 
                  !currentPassword || 
                  !newEmail || 
                  !newPassword || 
                  !confirmPassword ||
                  !passwordValidation.isValid ||
                  newPassword !== confirmPassword
                }
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Credentials
                  </>
                )}
              </Button>

              {!isUsingDefaultCredentials && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetToDefault}
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              )}
            </div>
          </form>

          {/* Password Requirements Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Password Requirements:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>At least 12 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
