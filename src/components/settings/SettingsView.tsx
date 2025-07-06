
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Store, Users, CreditCard, Globe, Bell, Shield, Key, UserPlus, Copy, ExternalLink, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SettingsView() {
  const { currentStore, isOwner } = useStore();
  const [showPinLoginDialog, setShowPinLoginDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'manager' | 'cashier'>('cashier');
  const [memberPin, setMemberPin] = useState('');
  const [adding, setAdding] = useState(false);

  const copyStoreCode = () => {
    if (currentStore?.store_code) {
      navigator.clipboard.writeText(currentStore.store_code);
      toast.success('Store code copied to clipboard!');
    }
  };

  const copyTeamLoginUrl = () => {
    if (currentStore?.store_code) {
      const url = `${window.location.origin}/store/${currentStore.store_code.toLowerCase()}`;
      navigator.clipboard.writeText(url);
      toast.success('Team login URL copied to clipboard!');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !memberName.trim() || !memberEmail.trim() || !memberPin.trim()) return;

    setAdding(true);
    try {
      // Invite the user to sign up
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(memberEmail, {
        data: { display_name: memberName }
      });
      
      if (inviteError) throw inviteError;
      const userId = inviteData.user?.id;

      if (!userId) throw new Error('Failed to get user ID');

      // Add them as a store member with PIN
      const { error } = await supabase
        .from('store_members')
        .insert([
          {
            store_id: currentStore.id,
            user_id: userId,
            role: memberRole,
            pin: memberPin,
            is_active: true
          }
        ]);

      if (error) throw error;

      toast.success('Team member added successfully!');
      setShowAddMemberDialog(false);
      setMemberName('');
      setMemberEmail('');
      setMemberRole('cashier');
      setMemberPin('');
    } catch (error: any) {
      toast.error('Failed to add team member: ' + error.message);
    } finally {
      setAdding(false);
    }
  };

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
              <Input id="store-name" defaultValue={currentStore?.name || "Main Store"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Address</Label>
              <Input id="store-address" defaultValue={currentStore?.address || "123 Main Street, City, State 12345"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone</Label>
                <Input id="store-phone" defaultValue={currentStore?.phone || "+1 (555) 123-4567"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-email">Email</Label>
                <Input id="store-email" defaultValue={currentStore?.email || "contact@store.com"} />
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
              <Select defaultValue={currentStore?.currency?.toLowerCase() || "usd"}>
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
              <Input id="tax-rate" defaultValue={currentStore?.tax_rate?.toString() || "8.25"} type="number" step="0.01" />
            </div>
            <Button className="w-full">Update Settings</Button>
          </CardContent>
        </Card>

        {/* Team Access & Store Code */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <QrCode className="w-5 h-5" />
              Team Access
            </CardTitle>
            <p className="text-muted-foreground">
              Share direct access to your store with team members
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">Store Code</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyStoreCode}
                  className="h-8"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="font-mono text-2xl font-bold text-primary mb-2">
                {currentStore?.store_code}
              </div>
              <p className="text-xs text-muted-foreground">
                Team members use this code to access the system
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">Direct Team Login URL</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyTeamLoginUrl}
                    className="h-8"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/store/${currentStore?.store_code?.toLowerCase()}`, '_blank')}
                    className="h-8"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm text-muted-foreground mb-2 break-all">
                {window.location.origin}/store/{currentStore?.store_code?.toLowerCase()}
              </div>
              <p className="text-xs text-muted-foreground">
                Team members can bookmark this URL for direct access
              </p>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
              <p className="text-sm text-info-foreground">
                💡 <strong>Team Setup:</strong> Share the store code or direct URL with your team members. 
                They can access the system independently without needing your login credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team & Role Management - Only for store owners */}
      {isOwner && (
        <Card className="card-professional">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5" />
              Team & Role Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-foreground">Team Members</h3>
                  <p className="text-sm text-muted-foreground">Manage your store team and their access</p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showPinLoginDialog} onOpenChange={setShowPinLoginDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Key className="w-4 h-4 mr-2" />
                        PIN Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Team PIN Login</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Team members can access the POS system using their name and 4-digit PIN
                        </p>
                        <Button 
                          className="w-full bg-gradient-primary text-white"
                          onClick={() => {
                            setShowPinLoginDialog(false);
                            // Navigate to PIN login page
                            window.location.href = '/pin-login';
                          }}
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Go to PIN Login
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddMember} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="memberName">Name *</Label>
                          <Input
                            id="memberName"
                            placeholder="Enter member name"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="memberEmail">Email *</Label>
                          <Input
                            id="memberEmail"
                            type="email"
                            placeholder="Enter member email"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="memberRole">Role</Label>
                          <Select value={memberRole} onValueChange={(value: 'manager' | 'cashier') => setMemberRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="cashier">Cashier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="memberPin">4-Digit PIN *</Label>
                          <Input
                            id="memberPin"
                            type="password"
                            placeholder="Enter 4-digit PIN"
                            value={memberPin}
                            onChange={(e) => setMemberPin(e.target.value)}
                            maxLength={4}
                            pattern="[0-9]{4}"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-primary text-white"
                          disabled={adding}
                        >
                          {adding ? 'Adding...' : 'Add Team Member'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Store Owner", users: 1, permissions: ["Full Access"], role: "owner" },
                  { name: "Manager", users: 2, permissions: ["POS", "Inventory", "Reports"], role: "manager" },
                  { name: "Cashier", users: 4, permissions: ["POS Only"], role: "cashier" },
                ].map((role) => (
                  <div key={role.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{role.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {role.users} user{role.users !== 1 ? 's' : ''} • {role.permissions.join(', ')}
                      </p>
                    </div>
                    <Badge variant={role.role === 'owner' ? "default" : "outline"}>
                      {role.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
