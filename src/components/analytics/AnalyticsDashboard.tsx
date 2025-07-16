import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalyticsTracking';

// Mock data - in a real implementation, this would come from your analytics backend
const mockAnalyticsData = {
  overview: {
    totalPageViews: 15420,
    uniqueUsers: 3240,
    averageSessionDuration: 285, // seconds
    bounceRate: 0.32,
    totalTransactions: 1250,
    totalRevenue: 45680.50,
  },
  pageViews: [
    { page: '/dashboard', views: 4520, uniqueUsers: 1200 },
    { page: '/pos', views: 3890, uniqueUsers: 890 },
    { page: '/inventory', views: 2340, uniqueUsers: 780 },
    { page: '/customers', views: 1890, uniqueUsers: 650 },
    { page: '/reports', views: 1560, uniqueUsers: 520 },
    { page: '/settings', views: 1220, uniqueUsers: 420 },
  ],
  userActivity: [
    { date: '2024-01-01', users: 120, sessions: 180, pageViews: 540 },
    { date: '2024-01-02', users: 135, sessions: 195, pageViews: 585 },
    { date: '2024-01-03', users: 142, sessions: 210, pageViews: 630 },
    { date: '2024-01-04', users: 128, sessions: 185, pageViews: 555 },
    { date: '2024-01-05', users: 156, sessions: 225, pageViews: 675 },
    { date: '2024-01-06', users: 148, sessions: 215, pageViews: 645 },
    { date: '2024-01-07', users: 162, sessions: 240, pageViews: 720 },
  ],
  performance: [
    { metric: 'Page Load Time', value: 1.2, unit: 's', status: 'good' },
    { metric: 'API Response Time', value: 245, unit: 'ms', status: 'good' },
    { metric: 'First Contentful Paint', value: 0.8, unit: 's', status: 'excellent' },
    { metric: 'Largest Contentful Paint', value: 1.5, unit: 's', status: 'good' },
    { metric: 'Cumulative Layout Shift', value: 0.05, unit: '', status: 'excellent' },
  ],
  errors: [
    { type: 'API Error', count: 12, trend: 'down' },
    { type: 'UI Error', count: 8, trend: 'stable' },
    { type: 'Auth Error', count: 3, trend: 'down' },
    { type: 'Payment Error', count: 2, trend: 'stable' },
  ],
  features: [
    { name: 'POS System', usage: 85, color: '#2CA01C' },
    { name: 'Inventory Management', usage: 72, color: '#3B82F6' },
    { name: 'Customer Management', usage: 68, color: '#8B5CF6' },
    { name: 'Reports', usage: 45, color: '#F59E0B' },
    { name: 'Settings', usage: 32, color: '#EF4444' },
  ],
};

const COLORS = ['#2CA01C', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(mockAnalyticsData);
  const [loading, setLoading] = useState(false);
  const { trackFeatureUsage } = useAnalytics();

  useEffect(() => {
    trackFeatureUsage('analytics_dashboard', 'view');
  }, [trackFeatureUsage]);

  const handleRefresh = async () => {
    setLoading(true);
    trackFeatureUsage('analytics_dashboard', 'refresh');
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    trackFeatureUsage('analytics_dashboard', 'export');
    // Implement export functionality
    console.log('Exporting analytics data...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Web Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your application usage and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(data.overview.averageSessionDuration / 60)}m {data.overview.averageSessionDuration % 60}s
            </div>
            <p className="text-xs text-muted-foreground">
              +5.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15.3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Trend</CardTitle>
                <CardDescription>Daily active users and page views</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#2CA01C" strokeWidth={2} />
                    <Line type="monotone" dataKey="pageViews" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages by view count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.pageViews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="page" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#2CA01C" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Core Web Vitals and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performance.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{metric.metric}</p>
                      <p className="text-sm text-muted-foreground">
                        {metric.value}{metric.unit}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
              <CardDescription>How users interact with different features</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.features}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, usage }) => `${name}: ${usage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {data.features.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Tracking</CardTitle>
              <CardDescription>Application errors and their trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.errors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{error.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {error.count} occurrences
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(error.trend)}
                      <span className="text-sm text-muted-foreground capitalize">
                        {error.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
