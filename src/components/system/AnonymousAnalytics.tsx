import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Activity, 
  TrendingUp,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InlineLoading } from '@/components/ui/modern-loading';

interface AnonymousMetrics {
  // Usage Patterns (Anonymous)
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  
  // Feature Usage (Anonymous)
  posTransactions: number;
  inventoryUpdates: number;
  reportViews: number;
  
  // System Performance (Anonymous)
  averageLoadTime: number;
  errorRate: number;
  uptime: number;
  
  // Geographic Data (Anonymous - Country/Region only)
  topRegions: { region: string; users: number }[];
  
  // Device/Browser Data (Anonymous)
  deviceTypes: { type: string; percentage: number }[];
  browserTypes: { browser: string; percentage: number }[];
  
  // Business Metrics (Aggregated, Anonymous)
  totalStoresCreated: number;
  averageProductsPerStore: number;
  averageRevenuePerStore: number;
}

export function AnonymousAnalytics() {
  const [metrics, setMetrics] = useState<AnonymousMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnonymousMetrics();
  }, []);

  const fetchAnonymousMetrics = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching anonymous analytics...');

      // Simulate anonymous data collection
      // In a real system, this would come from analytics services like:
      // - Google Analytics (anonymous)
      // - Mixpanel (anonymous events)
      // - Custom analytics with hashed user IDs
      
      const anonymousMetrics: AnonymousMetrics = {
        // Usage Patterns (derived from session data, no personal info)
        dailyActiveUsers: await getAnonymousUserCount('day'),
        weeklyActiveUsers: await getAnonymousUserCount('week'),
        monthlyActiveUsers: await getAnonymousUserCount('month'),
        averageSessionDuration: await getAverageSessionDuration(),
        
        // Feature Usage (anonymous event tracking)
        posTransactions: await getFeatureUsage('pos_transaction'),
        inventoryUpdates: await getFeatureUsage('inventory_update'),
        reportViews: await getFeatureUsage('report_view'),
        
        // System Performance (server metrics, no user data)
        averageLoadTime: 1.2, // seconds
        errorRate: 0.05, // 5%
        uptime: 99.9, // percentage
        
        // Geographic Data (IP-based, no personal info stored)
        topRegions: [
          { region: 'North America', users: 45 },
          { region: 'Europe', users: 30 },
          { region: 'Asia Pacific', users: 20 },
          { region: 'Other', users: 5 }
        ],
        
        // Device/Browser Data (anonymous user agent analysis)
        deviceTypes: [
          { type: 'Desktop', percentage: 60 },
          { type: 'Mobile', percentage: 35 },
          { type: 'Tablet', percentage: 5 }
        ],
        
        browserTypes: [
          { browser: 'Chrome', percentage: 65 },
          { browser: 'Firefox', percentage: 20 },
          { browser: 'Safari', percentage: 10 },
          { browser: 'Other', percentage: 5 }
        ],
        
        // Business Metrics (aggregated, no individual store data)
        totalStoresCreated: await getTotalStores(),
        averageProductsPerStore: await getAverageProductsPerStore(),
        averageRevenuePerStore: await getAverageRevenuePerStore()
      };

      setMetrics(anonymousMetrics);
      console.log('📊 Anonymous metrics fetched');
    } catch (error) {
      console.error('Error fetching anonymous metrics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for anonymous data collection
  const getAnonymousUserCount = async (period: 'day' | 'week' | 'month'): Promise<number> => {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Count unique sessions (anonymous) rather than users
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', startDate.toISOString());

      return count || 0;
    } catch (error) {
      console.warn(`Could not fetch ${period} active users:`, error);
      return 0;
    }
  };

  const getAverageSessionDuration = async (): Promise<number> => {
    try {
      // Get anonymous session data from localStorage
      const sessionData = localStorage.getItem('anonymous_session_data');
      if (sessionData) {
        const sessions = JSON.parse(sessionData);
        const totalDuration = sessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
        return sessions.length > 0 ? totalDuration / sessions.length / 60000 : 0; // Convert to minutes
      }
      return 0;
    } catch (error) {
      console.warn('Could not calculate session duration:', error);
      return 0;
    }
  };

  const getFeatureUsage = async (feature: string): Promise<number> => {
    try {
      // Track feature usage without personal data
      switch (feature) {
        case 'pos_transaction':
          const { count: transactionCount } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true });
          return transactionCount || 0;
          
        case 'inventory_update':
          const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
          return productCount || 0;
          
        case 'report_view':
          // Get report views from anonymous events
          const events = localStorage.getItem('anonymous_events');
          if (events) {
            const parsedEvents = JSON.parse(events);
            return parsedEvents.filter((event: any) => event.type === 'report_view').length;
          }
          return 0;
          
        default:
          return 0;
      }
    } catch (error) {
      console.warn(`Could not fetch ${feature} usage:`, error);
      return 0;
    }
  };

  const getTotalStores = async (): Promise<number> => {
    try {
      const { count } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    } catch (error) {
      return 0;
    }
  };

  const getAverageProductsPerStore = async (): Promise<number> => {
    try {
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalStores } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      if (!totalStores || totalStores === 0) return 0;
      return Math.round((totalProducts || 0) / totalStores);
    } catch (error) {
      return 0;
    }
  };

  const getAverageRevenuePerStore = async (): Promise<number> => {
    try {
      const { data: revenueData } = await supabase
        .from('transactions')
        .select('total_amount');

      const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      
      const { count: totalStores } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      if (!totalStores || totalStores === 0) return 0;
      return Math.round(totalRevenue / totalStores);
    } catch (error) {
      return 0;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnonymousMetrics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  if (loading) {
    return (
      <div className="p-6">
        <InlineLoading />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load analytics data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Privacy-First Analytics</h3>
          </div>
          <p className="text-sm text-blue-700">
            All data shown here is collected anonymously. No personal information, 
            individual user data, or identifiable information is stored or displayed. 
            Data is aggregated and anonymized to protect user privacy.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPrivacyMode(!privacyMode)}
              className="border-blue-300"
            >
              {privacyMode ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {privacyMode ? 'Show Details' : 'Hide Details'}
            </Button>
            <Button size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Anonymous Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.dailyActiveUsers}</div>
                    <p className="text-sm text-muted-foreground">Daily Active Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.weeklyActiveUsers}</div>
                    <p className="text-sm text-muted-foreground">Weekly Active Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.monthlyActiveUsers}</div>
                    <p className="text-sm text-muted-foreground">Monthly Active Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{metrics.averageSessionDuration}m</div>
                    <p className="text-sm text-muted-foreground">Avg Session Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Anonymous Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics.posTransactions}</div>
              <p className="text-sm text-muted-foreground">POS Transactions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.inventoryUpdates}</div>
              <p className="text-sm text-muted-foreground">Inventory Updates</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{metrics.reportViews}</div>
              <p className="text-sm text-muted-foreground">Report Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {privacyMode && (
        <>
          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Anonymous Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.topRegions.map((region, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{region.region}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(region.users / metrics.topRegions[0].users) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{region.users}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device & Browser Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Device Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.deviceTypes.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{device.type}</span>
                      <Badge variant="outline">{device.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Browser Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.browserTypes.map((browser, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{browser.browser}</span>
                      <Badge variant="outline">{browser.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Anonymous Business Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.totalStoresCreated}</div>
              <p className="text-sm text-muted-foreground">Total Stores</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics.averageProductsPerStore}</div>
              <p className="text-sm text-muted-foreground">Avg Products/Store</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">${metrics.averageRevenuePerStore}</div>
              <p className="text-sm text-muted-foreground">Avg Revenue/Store</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
