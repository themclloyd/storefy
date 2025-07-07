import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart3, TrendingUp, Calendar as CalendarIcon, Download, DollarSign, ShoppingCart, Users, Package, Loader2, ArrowUpRight, ArrowDownRight, Filter, RefreshCw, Eye, TrendingDown } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { DateRange } from "react-day-picker";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

interface SalesData {
  period: string;
  sales: number;
  orders: number;
  customers: number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  category?: string;
  margin?: number;
}

interface DiscountData {
  code: string;
  usage: number;
  discount: number;
  type: string;
  conversion_rate?: number;
}

interface ChartData {
  date: string;
  sales: number;
  orders: number;
  customers: number;
}

interface KPIMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

interface DatePreset {
  label: string;
  value: string;
  range: () => DateRange;
}

interface InventoryAnalytics {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categoryBreakdown: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  stockLevels: Array<{
    name: string;
    stock: number;
    threshold: number;
    status: 'healthy' | 'low' | 'out';
  }>;
}

interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  newCustomersThisMonth: number;
  topCustomers: Array<{
    name: string;
    total_spent: number;
    total_orders: number;
    status: string;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
}

export function ReportsView() {
  const { currentStore } = useStore();
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentDiscounts, setRecentDiscounts] = useState<DiscountData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [inventoryAnalytics, setInventoryAnalytics] = useState<InventoryAnalytics | null>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const datePresets: DatePreset[] = [
    {
      label: "Today",
      value: "today",
      range: () => ({ from: new Date(), to: new Date() }),
    },
    {
      label: "Yesterday",
      value: "yesterday",
      range: () => {
        const yesterday = subDays(new Date(), 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      label: "Last 7 days",
      value: "7d",
      range: () => ({ from: subDays(new Date(), 7), to: new Date() }),
    },
    {
      label: "Last 30 days",
      value: "30d",
      range: () => ({ from: subDays(new Date(), 30), to: new Date() }),
    },
    {
      label: "This month",
      value: "month",
      range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
    },
    {
      label: "This week",
      value: "week",
      range: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }),
    },
  ];

  useEffect(() => {
    if (currentStore && user) {
      fetchReportsData();
    }
  }, [currentStore, user, dateRange]);

  useEffect(() => {
    const preset = datePresets.find(p => p.value === selectedPeriod);
    if (preset) {
      setDateRange(preset.range());
    }
  }, [selectedPeriod]);

  const fetchReportsData = async () => {
    if (!currentStore) return;

    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchSalesData(),
        fetchTopProducts(),
        fetchDiscountData(),
        fetchChartData(),
        fetchKPIMetrics(),
        fetchInventoryAnalytics(),
        fetchCustomerAnalytics(),
      ]);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshData = async () => {
    await fetchReportsData();
    toast.success('Reports data refreshed');
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('reports-container');
      if (!element) return;

      toast.info('Generating PDF report...');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add title
      pdf.setFontSize(20);
      pdf.text(`${currentStore?.name || 'Store'} - Reports & Analytics`, 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 30);

      position = 40;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${currentStore?.name || 'Store'}_Reports_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = [
        // KPI Metrics
        ['KPI Metrics'],
        ['Metric', 'Value', 'Change %'],
        ...kpiMetrics.map(metric => [metric.title, metric.value, `${metric.change.toFixed(1)}%`]),
        [''],

        // Sales Data
        ['Sales Overview'],
        ['Period', 'Sales', 'Orders', 'Customers'],
        ...salesData.map(data => [data.period, data.sales.toFixed(2), data.orders, data.customers]),
        [''],

        // Top Products
        ['Top Products'],
        ['Product', 'Sales Count', 'Revenue'],
        ...topProducts.map(product => [product.name, product.sales, product.revenue.toFixed(2)]),
        [''],

        // Inventory Analytics
        ['Inventory Summary'],
        ['Total Products', inventoryAnalytics?.totalProducts || 0],
        ['Low Stock Items', inventoryAnalytics?.lowStockItems || 0],
        ['Out of Stock Items', inventoryAnalytics?.outOfStockItems || 0],
        ['Total Value', `$${inventoryAnalytics?.totalValue.toFixed(2) || '0.00'}`],
        [''],

        // Customer Analytics
        ['Customer Summary'],
        ['Total Customers', customerAnalytics?.totalCustomers || 0],
        ['Active Customers', customerAnalytics?.activeCustomers || 0],
        ['VIP Customers', customerAnalytics?.vipCustomers || 0],
        ['New This Month', customerAnalytics?.newCustomersThisMonth || 0],
      ];

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${currentStore?.name || 'Store'}_Reports_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('CSV report exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV report');
    }
  };

  const fetchSalesData = async () => {
    if (!currentStore) return;

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, customer_id, created_at')
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load sales data');
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayOrders = orders?.filter(order => new Date(order.created_at) >= today) || [];
      const yesterdayOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterday && orderDate < today;
      }) || [];
      const weekOrders = orders?.filter(order => new Date(order.created_at) >= weekStart) || [];
      const monthOrders = orders?.filter(order => new Date(order.created_at) >= monthStart) || [];

      const calculateStats = (orderList: any[]) => ({
        sales: orderList.reduce((sum, order) => sum + Number(order.total || 0), 0),
        orders: orderList.length,
        customers: new Set(orderList.map(order => order.customer_id).filter(Boolean)).size,
      });

      const todayStats = calculateStats(todayOrders);
      const yesterdayStats = calculateStats(yesterdayOrders);
      const weekStats = calculateStats(weekOrders);
      const monthStats = calculateStats(monthOrders);

      setSalesData([
        { period: "Today", ...todayStats },
        { period: "Yesterday", ...yesterdayStats },
        { period: "This Week", ...weekStats },
        { period: "This Month", ...monthStats },
      ]);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to load sales data');
    }
  };

  const fetchTopProducts = async () => {
    if (!currentStore) return;

    try {
      const { data: productSales, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products (name)
        `)
        .eq('products.store_id', currentStore.id);

      if (error) {
        console.error('Error fetching product sales:', error);
        toast.error('Failed to load top products');
        setTopProducts([]);
        return;
      }

      if (!productSales || productSales.length === 0) {
        setTopProducts([]);
        return;
      }

      // Group by product and calculate totals
      const productMap = new Map();
      productSales.forEach(item => {
        const productName = item.products?.name;
        if (productName) {
          const existing = productMap.get(productName) || { sales: 0, revenue: 0 };
          productMap.set(productName, {
            sales: existing.sales + (item.quantity || 0),
            revenue: existing.revenue + Number(item.total_price || 0),
          });
        }
      });

      // Convert to array and sort by revenue
      const topProductsArray = Array.from(productMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      setTopProducts(topProductsArray);
    } catch (error) {
      console.error('Error fetching top products:', error);
      toast.error('Failed to load top products');
      setTopProducts([]);
    }
  };

  const fetchDiscountData = async () => {
    if (!currentStore) return;

    const { data: discountOrders } = await supabase
      .from('orders')
      .select('discount_code, discount_amount')
      .eq('store_id', currentStore.id)
      .not('discount_code', 'is', null);

    if (!discountOrders) {
      setRecentDiscounts([]);
      return;
    }

    // Group by discount code
    const discountMap = new Map();
    discountOrders.forEach(order => {
      const code = order.discount_code;
      if (code) {
        const existing = discountMap.get(code) || { usage: 0, discount: 0 };
        discountMap.set(code, {
          usage: existing.usage + 1,
          discount: existing.discount + Number(order.discount_amount || 0),
          type: 'Unknown', // We don't store discount type in the current schema
        });
      }
    });

    // Convert to array and sort by usage
    const discountArray = Array.from(discountMap.entries())
      .map(([code, stats]) => ({ code, ...stats }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3);

    setRecentDiscounts(discountArray);
  };

  const fetchChartData = async () => {
    if (!currentStore || !dateRange.from || !dateRange.to) return;

    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total, customer_id')
      .eq('store_id', currentStore.id)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())
      .order('created_at');

    if (!orders) {
      setChartData([]);
      return;
    }

    // Group by date
    const dailyData = new Map();
    orders.forEach(order => {
      const date = format(new Date(order.created_at), 'MMM dd');
      const existing = dailyData.get(date) || { sales: 0, orders: 0, customers: new Set() };
      existing.sales += Number(order.total);
      existing.orders += 1;
      if (order.customer_id) existing.customers.add(order.customer_id);
      dailyData.set(date, existing);
    });

    const chartArray = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders,
      customers: data.customers.size,
    }));

    setChartData(chartArray);
  };

  const fetchKPIMetrics = async () => {
    if (!currentStore || !dateRange.from || !dateRange.to) return;

    // Current period data
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('total, created_at, customer_id')
      .eq('store_id', currentStore.id)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    // Previous period for comparison
    const periodDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = subDays(dateRange.from, periodDays);
    const previousTo = subDays(dateRange.to, periodDays);

    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total, created_at, customer_id')
      .eq('store_id', currentStore.id)
      .gte('created_at', previousFrom.toISOString())
      .lte('created_at', previousTo.toISOString());

    const calculateMetrics = (orders: any[]) => ({
      totalRevenue: orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0,
      totalOrders: orders?.length || 0,
      uniqueCustomers: new Set(orders?.map(order => order.customer_id).filter(Boolean)).size || 0,
      avgOrderValue: orders?.length ? (orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length) : 0,
    });

    const current = calculateMetrics(currentOrders || []);
    const previous = calculateMetrics(previousOrders || []);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const metrics: KPIMetric[] = [
      {
        title: "Total Revenue",
        value: `$${current.totalRevenue.toFixed(2)}`,
        change: calculateChange(current.totalRevenue, previous.totalRevenue),
        trend: current.totalRevenue > previous.totalRevenue ? 'up' : current.totalRevenue < previous.totalRevenue ? 'down' : 'neutral',
        icon: DollarSign,
        color: "text-success",
      },
      {
        title: "Total Orders",
        value: current.totalOrders,
        change: calculateChange(current.totalOrders, previous.totalOrders),
        trend: current.totalOrders > previous.totalOrders ? 'up' : current.totalOrders < previous.totalOrders ? 'down' : 'neutral',
        icon: ShoppingCart,
        color: "text-primary",
      },
      {
        title: "Unique Customers",
        value: current.uniqueCustomers,
        change: calculateChange(current.uniqueCustomers, previous.uniqueCustomers),
        trend: current.uniqueCustomers > previous.uniqueCustomers ? 'up' : current.uniqueCustomers < previous.uniqueCustomers ? 'down' : 'neutral',
        icon: Users,
        color: "text-secondary",
      },
      {
        title: "Avg Order Value",
        value: `$${current.avgOrderValue.toFixed(2)}`,
        change: calculateChange(current.avgOrderValue, previous.avgOrderValue),
        trend: current.avgOrderValue > previous.avgOrderValue ? 'up' : current.avgOrderValue < previous.avgOrderValue ? 'down' : 'neutral',
        icon: TrendingUp,
        color: "text-warning",
      },
    ];

    setKpiMetrics(metrics);
  };

  const fetchInventoryAnalytics = async () => {
    if (!currentStore) return;

    try {
      // Fetch products with categories
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          cost,
          stock_quantity,
          low_stock_threshold,
          is_active,
          categories (name)
        `)
        .eq('store_id', currentStore.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load inventory data');
        setInventoryAnalytics(null);
        return;
      }

      if (!products) {
        setInventoryAnalytics(null);
        return;
      }

      const totalProducts = products.length;
      const lowStockItems = products.filter(p =>
        p.stock_quantity !== null &&
        p.low_stock_threshold !== null &&
        p.stock_quantity <= p.low_stock_threshold &&
        p.stock_quantity > 0
      ).length;
      const outOfStockItems = products.filter(p => p.stock_quantity === 0).length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);

      // Category breakdown
      const categoryMap = new Map();
      products.forEach(product => {
        const categoryName = product.categories?.name || 'Uncategorized';
        const existing = categoryMap.get(categoryName) || { count: 0, value: 0 };
        existing.count += 1;
        existing.value += product.price * (product.stock_quantity || 0);
        categoryMap.set(categoryName, existing);
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value,
      }));

      // Stock levels for top products
      const stockLevels = products
        .filter(p => p.stock_quantity !== null)
        .sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0))
        .slice(0, 10)
        .map(product => ({
          name: product.name,
          stock: product.stock_quantity || 0,
          threshold: product.low_stock_threshold || 5,
          status: (product.stock_quantity || 0) === 0 ? 'out' as const :
                  (product.stock_quantity || 0) <= (product.low_stock_threshold || 5) ? 'low' as const :
                  'healthy' as const,
        }));

      setInventoryAnalytics({
        totalProducts,
        lowStockItems,
        outOfStockItems,
        totalValue,
        categoryBreakdown,
        stockLevels,
      });
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      setInventoryAnalytics(null);
    }
  };

  const fetchCustomerAnalytics = async () => {
    if (!currentStore) return;

    try {
      // Fetch customers
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customer data');
        setCustomerAnalytics(null);
        return;
      }

      if (!customers || customers.length === 0) {
        setCustomerAnalytics(null);
        return;
      }

      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => c.status === 'active').length;
      const vipCustomers = customers.filter(c => c.status === 'vip').length;

      // New customers this month
      const thisMonth = startOfMonth(new Date());
      const newCustomersThisMonth = customers.filter(c =>
        new Date(c.created_at) >= thisMonth
      ).length;

      // Top customers by spending
      const topCustomers = customers
        .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
        .slice(0, 5)
        .map(customer => ({
          name: customer.name,
          total_spent: customer.total_spent || 0,
          total_orders: customer.total_orders || 0,
          status: customer.status,
        }));

      // Customer segments
      const segments = [
        { segment: 'Active', count: activeCustomers },
        { segment: 'VIP', count: vipCustomers },
        { segment: 'Inactive', count: customers.filter(c => c.status === 'inactive').length },
      ];

      const customerSegments = segments.map(segment => ({
        ...segment,
        percentage: totalCustomers > 0 ? (segment.count / totalCustomers) * 100 : 0,
      }));

      setCustomerAnalytics({
        totalCustomers,
        activeCustomers,
        vipCustomers,
        newCustomersThisMonth,
        topCustomers,
        customerSegments,
      });
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      setCustomerAnalytics(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  return (
    <div id="reports-container" className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your business performance and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {datePresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiMetrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? ArrowUpRight : metric.trend === 'down' ? ArrowDownRight : TrendingUp;
          const trendColor = metric.trend === 'up' ? 'text-success' : metric.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

          return (
            <Card key={metric.title} className="card-professional hover:shadow-medium transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-muted/30`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                    <TrendIcon className="w-4 h-4" />
                    <span className="font-medium">
                      {Math.abs(metric.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {metric.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {metric.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Sales Trend Chart */}
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="w-5 h-5" />
                Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-medium)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="w-5 h-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No product sales data available</p>
                  <p className="text-sm">Start making sales to see top products</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">${product.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discount Usage */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="w-5 h-5" />
              Discount Code Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDiscounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No discount codes used yet</p>
                  <p className="text-sm">Discount usage will appear here</p>
                </div>
              ) : (
                recentDiscounts.map((discount) => (
                  <div key={discount.code} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                          {discount.code}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {discount.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Used {discount.usage} times</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning">${discount.discount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total discount</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Chart */}
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5" />
                  Orders Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Customer Chart */}
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="w-5 h-5" />
                  Customer Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {inventoryAnalytics?.totalProducts || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                  </div>
                  <Package className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-warning">
                      {inventoryAnalytics?.lowStockItems || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-destructive">
                      {inventoryAnalytics?.outOfStockItems || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                  <Package className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-success">
                      ${inventoryAnalytics?.totalValue.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryAnalytics?.categoryBreakdown || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="count"
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        {inventoryAnalytics?.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${200 + index * 40}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stock Levels */}
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Package className="w-5 h-5" />
                  Stock Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryAnalytics?.stockLevels.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No inventory data available</p>
                    </div>
                  ) : (
                    inventoryAnalytics?.stockLevels.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Threshold: {item.threshold}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{item.stock}</span>
                          <Badge
                            variant={item.status === 'healthy' ? 'default' :
                                   item.status === 'low' ? 'secondary' : 'destructive'}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {customerAnalytics?.totalCustomers || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-success">
                      {customerAnalytics?.activeCustomers || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Customers</p>
                  </div>
                  <Users className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-warning">
                      {customerAnalytics?.vipCustomers || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">VIP Customers</p>
                  </div>
                  <Users className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-secondary">
                      {customerAnalytics?.newCustomersThisMonth || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">New This Month</p>
                  </div>
                  <Users className="w-8 h-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Segments */}
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="w-5 h-5" />
                  Customer Segments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerAnalytics?.customerSegments || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="count"
                        label={({ segment, percentage }) => `${segment}: ${percentage.toFixed(1)}%`}
                      >
                        {customerAnalytics?.customerSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${120 + index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerAnalytics?.topCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No customer data available</p>
                    </div>
                  ) : (
                    customerAnalytics?.topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <Badge
                              variant={customer.status === 'vip' ? 'default' :
                                     customer.status === 'active' ? 'secondary' : 'outline'}
                            >
                              {customer.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {customer.total_orders} orders
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-success">${customer.total_spent.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}