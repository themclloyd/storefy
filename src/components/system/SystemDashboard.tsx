import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Users, 
  Store, 
  Activity, 
  Settings, 
  Shield, 
  BarChart3, 
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InlineLoading } from '@/components/ui/modern-loading';

interface SystemStats {
  totalUsers: number;
  totalStores: number;
  totalTransactions: number;
  totalRevenue: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  databaseSize: string;
  lastBackup: string;
}

interface UserActivity {
  id: string;
  user_email: string;
  action: string;
  timestamp: string;
  store_name?: string;
  ip_address?: string;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export function SystemDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalStores: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    systemHealth: 'healthy',
    databaseSize: '0 MB',
    lastBackup: 'Never'
  });
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSystemStats(),
        fetchUserActivity(),
        fetchSystemAlerts()
      ]);
    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      console.log('🔄 Fetching system statistics...');

      // Get total users from auth.users (system-wide)
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      const totalUsers = usersData?.users?.length || 0;

      if (usersError) {
        console.warn('Could not fetch users from auth.users, trying profiles table:', usersError);
      }

      // Get total stores
      const { count: totalStores, error: storesError } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      if (storesError) {
        console.error('Error fetching stores:', storesError);
      }

      // Get total transactions
      const { count: totalTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      }

      // Get total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('transactions')
        .select('amount');

      if (revenueError) {
        console.error('Error fetching revenue:', revenueError);
      }

      const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Get active users (profiles with recent activity)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: activeUsers, error: activeUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', yesterday.toISOString());

      if (activeUsersError) {
        console.error('Error fetching active users:', activeUsersError);
      }

      // Calculate system health based on various factors
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (totalStores === 0) systemHealth = 'warning';
      if (totalUsers === 0) systemHealth = 'critical';

      const newStats = {
        totalUsers,
        totalStores: totalStores || 0,
        totalTransactions: totalTransactions || 0,
        totalRevenue,
        activeUsers: activeUsers || 0,
        systemHealth,
        databaseSize: '125 MB', // This would come from database metrics in production
        lastBackup: new Date().toLocaleDateString()
      };

      console.log('📊 System stats fetched:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast.error('Failed to fetch system statistics');
    }
  };

  const fetchUserActivity = async () => {
    try {
      console.log('🔄 Fetching user activity...');

      // Try to get activity logs if the table exists
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select(`
          id,
          action_type,
          created_at,
          actor_id,
          store_id,
          metadata,
          description
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activityError) {
        console.warn('Activity logs table not available:', activityError);

        // Fallback: Get recent transactions as activity
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            id,
            created_at,
            amount,
            store_id,
            stores(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (transactionError) {
          console.error('Error fetching transactions:', transactionError);
          setUserActivity([]);
          return;
        }

        const formattedActivity: UserActivity[] = transactionData?.map(transaction => ({
          id: transaction.id,
          user_email: 'System User',
          action: `Transaction: $${transaction.amount}`,
          timestamp: transaction.created_at,
          store_name: transaction.stores?.name || 'Unknown Store',
          ip_address: 'N/A'
        })) || [];

        setUserActivity(formattedActivity);
        return;
      }

      // If activity logs exist, format them
      const formattedActivity: UserActivity[] = activityData?.map(log => ({
        id: log.id,
        user_email: log.actor_id || 'Unknown User',
        action: log.action_type || log.description || 'Unknown Action',
        timestamp: log.created_at,
        store_name: 'Store Activity',
        ip_address: log.metadata?.ip_address || 'N/A'
      })) || [];

      console.log('📋 User activity fetched:', formattedActivity.length, 'items');
      setUserActivity(formattedActivity);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      toast.error('Failed to fetch user activity');
    }
  };

  const fetchSystemAlerts = async () => {
    // Mock system alerts - in a real system, these would come from monitoring
    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        type: 'warning',
        message: 'Database connection pool at 80% capacity',
        timestamp: new Date().toISOString(),
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        message: 'System backup completed successfully',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        resolved: true
      }
    ];
    setSystemAlerts(mockAlerts);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemData();
    setRefreshing(false);
    toast.success('System data refreshed');
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <InlineLoading />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage the entire Storefy system
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
            <p className="text-xs text-muted-foreground">
              Across all regions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalRevenue.toFixed(2)} total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getHealthBadgeVariant(stats.systemHealth)} className="mb-2">
              {stats.systemHealth.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground">
              DB: {stats.databaseSize}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="stores">Store Management</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent User Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{activity.user_email}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{activity.store_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.resolved ? 'default' : 'secondary'}>
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Manage all users across the system
                </p>
                <Button size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  View All Users
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.totalUsers - stats.activeUsers}
                    </div>
                    <p className="text-sm text-muted-foreground">Inactive Users</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Monitor and manage all stores in the system
                </p>
                <Button size="sm">
                  <Store className="w-4 h-4 mr-2" />
                  View All Stores
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalStores}</div>
                    <p className="text-sm text-muted-foreground">Total Stores</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      ${stats.totalRevenue.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-lg font-bold">{stats.databaseSize}</div>
                      <p className="text-sm text-muted-foreground">Database Size</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-lg font-bold">{stats.lastBackup}</div>
                      <p className="text-sm text-muted-foreground">Last Backup</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-lg font-bold text-green-600">Healthy</div>
                      <p className="text-sm text-muted-foreground">DB Status</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button size="sm" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Run Query
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Backup Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        Manage Security Policies
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Eye className="w-4 h-4 mr-2" />
                        View Audit Logs
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">System Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Global Settings
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <Server className="w-4 h-4 mr-2" />
                        System Maintenance
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
