import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  ArrowRight, 
  Star,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentStore } from '@/stores/storeStore';
import { useStoreData } from '@/hooks/useSupabaseClient';
import { useTax } from '@/hooks/useTax';

interface CustomersWidgetProps {
  onViewMore: () => void;
}

interface CustomerData {
  totalCustomers: number;
  newCustomersToday: number;
  customerGrowth: number;
  vipCustomers: number;
  averageOrderValue: number;
  recentCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    lastVisit: string;
    isVip: boolean;
  }>;
}

export function CustomersWidget({ onViewMore }: CustomersWidgetProps) {
  const currentStore = useCurrentStore();
  const { from, currentStoreId, isPinSession } = useStoreData();
  const { formatCurrency } = useTax();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData>({
    totalCustomers: 0,
    newCustomersToday: 0,
    customerGrowth: 0,
    vipCustomers: 0,
    averageOrderValue: 0,
    recentCustomers: []
  });

  useEffect(() => {
    if ((currentStore && !isPinSession) || (currentStoreId && isPinSession)) {
      fetchCustomerData();
    }
  }, [currentStore, currentStoreId, isPinSession]);

  const fetchCustomerData = async () => {
    const storeId = currentStoreId || currentStore?.id;
    if (!storeId) return;

    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch all customers
      const { data: customers } = await from('customers')
        .select(`
          id,
          name,
          email,
          created_at,
          status,
          total_orders,
          total_spent
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (!customers || customers.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate customer metrics
      const totalCustomers = customers.length;
      const newCustomersToday = customers.filter(c => c.created_at.startsWith(today)).length;

      // Calculate customer growth (comparing to last month)
      const lastMonthCustomers = customers.filter(c => c.created_at < lastMonth).length;
      const newLastMonth = totalCustomers - lastMonthCustomers;
      const customerGrowth = lastMonthCustomers > 0 ? (newLastMonth / lastMonthCustomers) * 100 : 0;

      // Count VIP customers
      const vipCustomers = customers.filter(c => c.status === 'vip').length;

      // Calculate average order value from customer data
      const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
      const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Format recent customers with their spending data
      const recentCustomers = customers.slice(0, 3).map(customer => {
        const customerTotalSpent = customer.total_spent || 0;

        // Calculate last visit (simplified - using created_at as approximation)
        const createdDate = new Date(customer.created_at);
        const timeDiff = Date.now() - createdDate.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

        let lastVisit = 'Never';
        if (hoursAgo < 24) {
          lastVisit = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
        } else {
          const daysAgo = Math.floor(hoursAgo / 24);
          lastVisit = `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
        }

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email || '',
          totalSpent: customerTotalSpent,
          lastVisit,
          isVip: customer.status === 'vip'
        };
      });

      setCustomerData({
        totalCustomers,
        newCustomersToday,
        customerGrowth,
        vipCustomers,
        averageOrderValue,
        recentCustomers
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Customer Overview</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            Customer Overview
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewMore}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Customer Metrics */}
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {customerData.totalCustomers}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Customers</span>
              <div className="flex items-center text-xs text-success">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{customerData.customerGrowth.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-lg font-semibold text-foreground">
                {customerData.newCustomersToday}
              </div>
              <div className="text-xs text-muted-foreground">New Today</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">
                {customerData.vipCustomers}
              </div>
              <div className="text-xs text-muted-foreground">VIP Members</div>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg. Order Value</span>
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(customerData.averageOrderValue)}
            </span>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Recent Customers</h4>
            <Badge variant="secondary" className="text-xs">
              {customerData.newCustomersToday} new today
            </Badge>
          </div>
          
          <div className="space-y-2">
            {customerData.recentCustomers.slice(0, 3).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{customer.name}</span>
                    {customer.isVip && (
                      <Star className="w-3 h-3 text-warning fill-warning" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(customer.totalSpent)} spent • {customer.lastVisit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Add Customer
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8"
              onClick={onViewMore}
            >
              <Eye className="w-3 h-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
