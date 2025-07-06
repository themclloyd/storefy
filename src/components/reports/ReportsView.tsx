import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, ShoppingCart, Users, Package } from "lucide-react";

export function ReportsView() {
  const salesData = [
    { period: "Today", sales: 847.32, orders: 23, customers: 18 },
    { period: "Yesterday", sales: 743.21, orders: 19, customers: 16 },
    { period: "This Week", sales: 4234.67, orders: 127, customers: 89 },
    { period: "This Month", sales: 15847.93, orders: 456, customers: 234 },
  ];

  const topProducts = [
    { name: "Premium Coffee Beans", sales: 234, revenue: 5847.66 },
    { name: "Organic Tea Set", sales: 156, revenue: 2494.44 },
    { name: "Ceramic Mug", sales: 189, revenue: 1699.11 },
    { name: "Artisan Cookies", sales: 98, revenue: 1272.02 },
  ];

  const recentDiscounts = [
    { code: "SAVE10", usage: 23, discount: 234.56, type: "Percentage" },
    { code: "WELCOME", usage: 12, discount: 180.00, type: "Fixed" },
    { code: "BULK20", usage: 8, discount: 156.78, type: "Percentage" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your business performance and insights
          </p>
        </div>
        <Button className="bg-gradient-primary text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesData.map((data, index) => (
          <Card key={data.period} className="card-professional">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {data.period}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Sales</span>
                </div>
                <span className="font-bold text-success">${data.sales}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Orders</span>
                </div>
                <span className="font-medium text-foreground">{data.orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Customers</span>
                </div>
                <span className="font-medium text-foreground">{data.customers}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              {topProducts.map((product, index) => (
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
              ))}
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
              {recentDiscounts.map((discount) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5" />
            Sales Trend (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Sales chart will be displayed here</p>
              <p className="text-sm text-muted-foreground">Chart integration coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}