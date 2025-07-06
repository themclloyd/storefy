import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from "lucide-react";

const stats = [
  {
    title: "Today's Sales",
    value: "$2,847.32",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Orders",
    value: "47",
    change: "+8.2%",
    trend: "up" as const,
    icon: ShoppingCart,
  },
  {
    title: "Low Stock Items",
    value: "12",
    change: "-2",
    trend: "down" as const,
    icon: Package,
  },
  {
    title: "New Customers",
    value: "8",
    change: "+3",
    trend: "up" as const,
    icon: Users,
  },
];

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening at your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <Card key={stat.title} className="card-professional">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">Order #{1000 + i}</p>
                  <p className="text-sm text-muted-foreground">Customer {i}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">${(Math.random() * 100 + 20).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{Math.floor(Math.random() * 60)} mins ago</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full p-4 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-smooth">
              Open POS System
            </button>
            <button className="w-full p-4 bg-secondary/10 text-secondary rounded-lg font-medium hover:bg-secondary/20 transition-smooth">
              Add New Product
            </button>
            <button className="w-full p-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-smooth">
              View Reports
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}