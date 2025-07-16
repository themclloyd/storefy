import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Crown,
  BarChart3
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_orders: number | null;
  total_spent: number | null;
  status: string | null;
  created_at: string;
}

interface CustomerAnalyticsProps {
  customers: Customer[];
}

interface MonthlyData {
  month: string;
  newCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
}



export function CustomerAnalytics({ customers }: CustomerAnalyticsProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const generateMonthlyData = useCallback(() => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.created_at);
        return customerDate.getMonth() === date.getMonth() && 
               customerDate.getFullYear() === date.getFullYear();
      });

      const totalRevenue = monthCustomers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0);
      const totalOrders = monthCustomers.reduce((sum, customer) => sum + (customer.total_orders || 0), 0);
      
      last6Months.push({
        month: monthName,
        newCustomers: monthCustomers.length,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      });
    }

    setMonthlyData(last6Months);
  }, [customers]);

  useEffect(() => {
    if (customers.length > 0) {
      generateMonthlyData();
    }
  }, [customers, generateMonthlyData]);

  // Calculate analytics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;

  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0);
  const totalOrders = customers.reduce((sum, customer) => sum + (customer.total_orders || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Customer segmentation data
  const statusData = [
    { name: 'Active', value: activeCustomers, color: '#10b981' },
    { name: 'VIP', value: vipCustomers, color: '#f59e0b' },
    { name: 'Inactive', value: inactiveCustomers, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // Top customers by spending
  const topCustomers = [...customers]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 5);

  // Customer lifetime value segments
  const lifetimeValueSegments = [
    { range: '$0-$100', count: customers.filter(c => (c.total_spent || 0) < 100).length },
    { range: '$100-$500', count: customers.filter(c => (c.total_spent || 0) >= 100 && (c.total_spent || 0) < 500).length },
    { range: '$500-$1000', count: customers.filter(c => (c.total_spent || 0) >= 500 && (c.total_spent || 0) < 1000).length },
    { range: '$1000+', count: customers.filter(c => (c.total_spent || 0) >= 1000).length }
  ].filter(segment => segment.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customer Analytics</h2>
          <p className="text-muted-foreground">
            Insights and metrics about your customer base
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          {totalCustomers} Total Customers
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Customer Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${averageCustomerValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime value per customer
            </p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Order Value
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VIP Customers
            </CardTitle>
            <Crown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{vipCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {totalCustomers > 0 ? ((vipCustomers / totalCustomers) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Status Distribution */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle>Customer Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No customer data available
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Customer Growth */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle>Monthly Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="newCustomers" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No growth data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle>Top Customers by Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.total_orders || 0} orders
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-success">
                        ${(customer.total_spent || 0).toFixed(2)}
                      </div>
                      <Badge 
                        variant="secondary"
                        className={
                          customer.status === 'vip' ? 'bg-warning/10 text-warning' :
                          customer.status === 'active' ? 'bg-success/10 text-success' :
                          'text-muted-foreground'
                        }
                      >
                        {(customer.status || 'active').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Lifetime Value Segments */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle>Customer Lifetime Value Segments</CardTitle>
          </CardHeader>
          <CardContent>
            {lifetimeValueSegments.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lifetimeValueSegments} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="range" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No segmentation data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
