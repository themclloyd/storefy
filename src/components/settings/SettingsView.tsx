import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Store, Users, CreditCard, Globe, Bell, Shield } from "lucide-react";

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your store configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Store className="w-5 h-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" defaultValue="Main Store" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Address</Label>
              <Input id="store-address" defaultValue="123 Main Street, City, State 12345" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone</Label>
                <Input id="store-phone" defaultValue="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-email">Email</Label>
                <Input id="store-email" defaultValue="contact@store.com" />
              </div>
            </div>
            <Button className="w-full">Update Store Info</Button>
          </CardContent>
        </Card>

        {/* Currency & Regional */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5" />
              Currency & Regional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select defaultValue="usd">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                  <SelectItem value="cad">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select defaultValue="est">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="est">Eastern (EST)</SelectItem>
                  <SelectItem value="cst">Central (CST)</SelectItem>
                  <SelectItem value="mst">Mountain (MST)</SelectItem>
                  <SelectItem value="pst">Pacific (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input id="tax-rate" defaultValue="8.25" type="number" step="0.01" />
            </div>
            <Button className="w-full">Update Settings</Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Cash", account: "N/A", provider: "In-Store", active: true },
                { name: "Credit Card", account: "****1234", provider: "Square", active: true },
                { name: "Debit Card", account: "****5678", provider: "Square", active: true },
                { name: "Digital Wallet", account: "Apple Pay", provider: "Integrated", active: false },
              ].map((method) => (
                <div key={method.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{method.name}</p>
                    <p className="text-sm text-muted-foreground">{method.account} • {method.provider}</p>
                  </div>
                  <Badge variant={method.active ? "default" : "outline"}>
                    {method.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full">
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Roles */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5" />
            User Roles & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Store Owner", users: 1, permissions: ["Full Access"] },
              { name: "Manager", users: 2, permissions: ["POS", "Inventory", "Reports"] },
              { name: "Cashier", users: 4, permissions: ["POS Only"] },
            ].map((role) => (
              <div key={role.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{role.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.users} user{role.users !== 1 ? 's' : ''} • {role.permissions.join(', ')}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Edit Role
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Add New Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Low Stock Alerts", description: "Get notified when inventory is running low", enabled: true },
              { label: "Daily Sales Summary", description: "Receive end-of-day sales reports", enabled: true },
              { label: "New Customer Signups", description: "Be notified of new customer registrations", enabled: false },
              { label: "System Updates", description: "Receive notifications about system updates", enabled: true },
            ].map((notification) => (
              <div key={notification.label} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{notification.label}</p>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                </div>
                <Badge variant={notification.enabled ? "default" : "outline"}>
                  {notification.enabled ? "On" : "Off"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}