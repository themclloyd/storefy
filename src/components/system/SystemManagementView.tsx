import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Database,
  Users,
  Store,
  Activity,
  Settings,
  AlertTriangle,
  Crown,
  Lock,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Terminal,
  BarChart3,
  FileText,
  Clock,
  LogOut
} from 'lucide-react';
import { SystemDashboard } from './SystemDashboard';
import { SystemAdminAuth, isSystemAdminAuthenticated, clearSystemAdminSession } from './SystemAdminAuth';
import { AdminCredentialsManager } from './AdminCredentialsManager';
import { UserManagement } from './UserManagement';
import { StoreManagement } from './StoreManagement';
import { DatabaseManagement } from './DatabaseManagement';
import { AnonymousAnalytics } from './AnonymousAnalytics';
import { PrivacySettings } from './PrivacySettings';
import { ModernSystemDashboard } from './ModernSystemDashboard';
import { useUser } from '@/stores/authStore';
import { usePermissions } from '@/stores/permissionStore';
import { useNavigate } from 'react-router-dom';

interface SystemManagementViewProps {
  onViewChange?: (view: string) => void;
}

export function SystemManagementView({ onViewChange }: SystemManagementViewProps = {}) {
  const user = useUser();
  const { userRole } = usePermissions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modernView, setModernView] = useState(false);

  // Check if admin is already authenticated
  React.useEffect(() => {
    setIsAuthenticated(isSystemAdminAuthenticated());
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    clearSystemAdminSession();
    setIsAuthenticated(false);
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SystemAdminAuth
        onAuthenticated={handleAuthenticated}
        onCancel={handleCancel}
      />
    );
  }

  // Show modern dashboard if enabled
  if (modernView) {
    return <ModernSystemDashboard onBackToClassic={() => setModernView(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* System Admin Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Crown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">System Management</h1>
                <p className="text-muted-foreground">
                  Full system administration and monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={modernView ? "default" : "outline"}
                size="sm"
                onClick={() => setModernView(!modernView)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {modernView ? "Classic View" : "Modern View"}
              </Button>
              <Badge variant="destructive" className="gap-1">
                <Shield className="w-3 h-3" />
                ADMIN ACCESS
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="p-4 bg-red-50 border-b border-red-200">
        <Alert className="border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Warning:</strong> You are in System Administration mode. 
            Actions performed here can affect the entire system and all users. 
            Please proceed with caution.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Stores
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <SystemDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="stores" className="space-y-4">
            <StoreManagement />
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <DatabaseManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnonymousAnalytics />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  System Logs & Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Audit Logs
                  </Button>
                  <Button size="sm" variant="outline">
                    <Activity className="w-4 h-4 mr-2" />
                    Activity Logs
                  </Button>
                  <Button size="sm" variant="outline">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Error Logs
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Monitor all system activities, user actions, and security events.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Security Policies
                  </Button>
                  <Button size="sm" variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Access Control
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Security Events
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage system security settings, access controls, and monitor security events.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <AdminCredentialsManager />

            <PrivacySettings />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Global Settings
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    System Maintenance
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Configuration
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure global system settings and perform maintenance tasks.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
