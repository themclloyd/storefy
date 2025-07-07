import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, Users, Clock, AlertTriangle } from "lucide-react";
import { DateRange } from "react-day-picker";

interface LaybyReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReportData {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  completionRate: number;
  activeOrders: number;
  completedOrders: number;
  overdueOrders: number;
  cancelledOrders: number;
  totalDeposits: number;
  outstandingBalance: number;
  topCustomers: Array<{
    customer_name: string;
    total_orders: number;
    total_value: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    orders: number;
    value: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export function LaybyReportsDialog({ open, onOpenChange }: LaybyReportsDialogProps) {
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    if (open && currentStore) {
      fetchReportData();
    }
  }, [open, currentStore, reportType, dateRange]);

  const fetchReportData = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      let query = supabase
        .from('layby_orders')
        .select(`
          *,
          layby_items (
            quantity,
            unit_price,
            total_price
          ),
          layby_payments (
            amount
          )
        `)
        .eq('store_id', currentStore.id);

      // Apply date range filter if selected
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data: laybyOrders, error } = await query;

      if (error) {
        throw error;
      }

      // Calculate report metrics
      const totalOrders = laybyOrders?.length || 0;
      const totalValue = laybyOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
      
      const activeOrders = laybyOrders?.filter(o => o.status === 'active').length || 0;
      const completedOrders = laybyOrders?.filter(o => o.status === 'completed').length || 0;
      const overdueOrders = laybyOrders?.filter(o => o.status === 'overdue').length || 0;
      const cancelledOrders = laybyOrders?.filter(o => o.status === 'cancelled').length || 0;
      
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      const totalDeposits = laybyOrders?.reduce((sum, order) => sum + order.deposit_amount, 0) || 0;
      const outstandingBalance = laybyOrders?.filter(o => o.status === 'active' || o.status === 'overdue')
        .reduce((sum, order) => sum + order.balance_remaining, 0) || 0;

      // Top customers
      const customerMap = new Map();
      laybyOrders?.forEach(order => {
        const key = order.customer_name;
        if (customerMap.has(key)) {
          const existing = customerMap.get(key);
          customerMap.set(key, {
            customer_name: key,
            total_orders: existing.total_orders + 1,
            total_value: existing.total_value + order.total_amount
          });
        } else {
          customerMap.set(key, {
            customer_name: key,
            total_orders: 1,
            total_value: order.total_amount
          });
        }
      });
      const topCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 10);

      // Monthly trends (last 12 months)
      const monthlyMap = new Map();
      const last12Months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().slice(0, 7); // YYYY-MM format
      }).reverse();

      last12Months.forEach(month => {
        monthlyMap.set(month, { month, orders: 0, value: 0 });
      });

      laybyOrders?.forEach(order => {
        const month = order.created_at.slice(0, 7);
        if (monthlyMap.has(month)) {
          const existing = monthlyMap.get(month);
          monthlyMap.set(month, {
            ...existing,
            orders: existing.orders + 1,
            value: existing.value + order.total_amount
          });
        }
      });

      const monthlyTrends = Array.from(monthlyMap.values());

      // Status breakdown
      const statusBreakdown = [
        { status: 'active', count: activeOrders, percentage: totalOrders > 0 ? (activeOrders / totalOrders) * 100 : 0 },
        { status: 'completed', count: completedOrders, percentage: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0 },
        { status: 'overdue', count: overdueOrders, percentage: totalOrders > 0 ? (overdueOrders / totalOrders) * 100 : 0 },
        { status: 'cancelled', count: cancelledOrders, percentage: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0 }
      ];

      setReportData({
        totalOrders,
        totalValue,
        averageOrderValue,
        completionRate,
        activeOrders,
        completedOrders,
        overdueOrders,
        cancelledOrders,
        totalDeposits,
        outstandingBalance,
        topCustomers,
        monthlyTrends,
        statusBreakdown
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportContent = `
Layby Report - ${currentStore?.name}
Generated: ${new Date().toLocaleString()}
${dateRange?.from ? `Date Range: ${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() || 'Present'}` : 'All Time'}

OVERVIEW
========
Total Orders: ${reportData.totalOrders}
Total Value: $${reportData.totalValue.toFixed(2)}
Average Order Value: $${reportData.averageOrderValue.toFixed(2)}
Completion Rate: ${reportData.completionRate.toFixed(1)}%
Outstanding Balance: $${reportData.outstandingBalance.toFixed(2)}

STATUS BREAKDOWN
===============
Active: ${reportData.activeOrders} (${reportData.statusBreakdown.find(s => s.status === 'active')?.percentage.toFixed(1)}%)
Completed: ${reportData.completedOrders} (${reportData.statusBreakdown.find(s => s.status === 'completed')?.percentage.toFixed(1)}%)
Overdue: ${reportData.overdueOrders} (${reportData.statusBreakdown.find(s => s.status === 'overdue')?.percentage.toFixed(1)}%)
Cancelled: ${reportData.cancelledOrders} (${reportData.statusBreakdown.find(s => s.status === 'cancelled')?.percentage.toFixed(1)}%)

TOP CUSTOMERS
============
${reportData.topCustomers.map((customer, index) => 
  `${index + 1}. ${customer.customer_name} - ${customer.total_orders} orders, $${customer.total_value.toFixed(2)}`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layby-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Layby Reports & Analytics
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive reports and analytics for layby performance, trends, and customer insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="trends">Trends</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              className="w-[300px]"
            />

            <Button
              variant="outline"
              onClick={exportReport}
              disabled={!reportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading report data...</p>
              </div>
            </div>
          ) : reportData ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalOrders}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalValue.toFixed(0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.completionRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${reportData.outstandingBalance.toFixed(0)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reportData.statusBreakdown.map(status => (
                      <div key={status.status} className="text-center">
                        <div className="text-2xl font-bold mb-1">{status.count}</div>
                        <Badge variant={
                          status.status === 'active' ? 'default' :
                          status.status === 'completed' ? 'secondary' :
                          status.status === 'overdue' ? 'destructive' : 'outline'
                        }>
                          {status.status} ({status.percentage.toFixed(1)}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Customers */}
              {reportData.topCustomers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Top Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Total Value</TableHead>
                          <TableHead>Avg Order</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.topCustomers.slice(0, 5).map((customer, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{customer.customer_name}</TableCell>
                            <TableCell>{customer.total_orders}</TableCell>
                            <TableCell>${customer.total_value.toFixed(2)}</TableCell>
                            <TableCell>${(customer.total_value / customer.total_orders).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No data available for the selected criteria</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
