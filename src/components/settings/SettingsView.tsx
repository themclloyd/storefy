
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Users, Shield, Eye, EyeOff, Edit, Trash2, UserCheck, UserX, Crown, UserCog, HelpCircle, UserPlus, Store, Globe, CreditCard, Bell, Activity, Copy } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { teamMemberLogs } from "@/lib/activityLogger";

interface TeamMember {
  id: string;
  user_id?: string | null;
  role: 'owner' | 'manager' | 'cashier';
  is_active: boolean;
  created_at: string;
  name: string;
  phone?: string;
  email?: string;
  pin?: string;
}

interface RoleStats {
  owner: number;
  manager: number;
  cashier: number;
  total: number;
}

export function SettingsView() {
  const { currentStore, isOwner, userRole, refreshStores } = useStore();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats>({ owner: 0, manager: 0, cashier: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Add member dialog state
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'manager' | 'cashier'>('cashier');
  const [memberPin, setMemberPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [adding, setAdding] = useState(false);

  // Edit member dialog state
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editing, setEditing] = useState(false);

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('team');

  // Store settings state
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeCurrency, setStoreCurrency] = useState('USD');
  const [storeTaxRate, setStoreTaxRate] = useState('8.25');
  const [updatingStore, setUpdatingStore] = useState(false);

  useEffect(() => {
    if (currentStore) {
      fetchTeamMembers();
    }
  }, [currentStore]);

  useEffect(() => {
    if (activeTab === 'activity' && currentStore && activityLogs.length === 0) {
      fetchActivityLogs();
    }
  }, [activeTab, currentStore]);

  useEffect(() => {
    if (currentStore) {
      setStoreName(currentStore.name || '');
      setStoreAddress(currentStore.address || '');
      setStorePhone(currentStore.phone || '');
      setStoreEmail(currentStore.email || '');
      setStoreCurrency(currentStore.currency || 'USD');
      setStoreTaxRate(currentStore.tax_rate?.toString() || '8.25');
    }
  }, [currentStore]);

  const fetchTeamMembers = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);

      // Get store members (roles only, no user accounts)
      const { data: members, error } = await supabase
        .from('store_members')
        .select(`
          id,
          user_id,
          role,
          is_active,
          created_at,
          name,
          phone,
          email,
          pin
        `)
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out the store owner user (only show roles)
      const roleMembers = (members || []).filter(member =>
        member.user_id !== currentStore.owner_id
      );

      setTeamMembers(roleMembers);
      // Calculate role statistics (roles only, plus 1 owner)
      const stats = roleMembers.reduce((acc, member) => {
        if (member.is_active) {
          acc[member.role]++;
          acc.total++;
        }
        return acc;
      }, { owner: 1, manager: 0, cashier: 0, total: 1 }); // Start with 1 owner

      setRoleStats(stats);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!currentStore || !memberName.trim() || !memberPhone.trim() || !memberPin.trim()) {
      toast.error('Please fill in all required fields (Name, Phone, PIN)');
      return;
    }

    if (memberPin.length !== 4 || !/^\d{4}$/.test(memberPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(memberPhone.replace(/[\s\-\(\)]/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setAdding(true);
    try {
      // First, check if PIN is already in use in this store
      const { data: existingPin } = await supabase
        .from('store_members')
        .select('id')
        .eq('store_id', currentStore.id)
        .eq('pin', memberPin)
        .maybeSingle();

      if (existingPin) {
        toast.error('This PIN is already in use. Please choose a different PIN.');
        return;
      }

      // Create team member role directly (no user account needed)
      const { error: memberError } = await supabase
        .from('store_members')
        .insert({
          store_id: currentStore.id,
          user_id: null, // No user account for roles
          role: memberRole,
          name: memberName,
          phone: memberPhone,
          email: memberEmail.trim() || null,
          pin: memberPin,
          is_active: true
        });

      if (memberError) throw memberError;

      // Log the activity
      await teamMemberLogs.added(
        currentStore.id,
        user?.user_metadata?.display_name || user?.email || 'Store Owner',
        memberName,
        memberRole,
        user?.id
      );

      toast.success(`${memberName} has been added as a ${memberRole}!`);

      // Reset form and close dialog
      setMemberName('');
      setMemberPhone('');
      setMemberEmail('');
      setMemberRole('cashier');
      setMemberPin('');
      setShowPin(false);
      setShowAddMemberDialog(false);

      // Refresh team members list and activity logs if on activity tab
      fetchTeamMembers();
      if (activeTab === 'activity') {
        fetchActivityLogs();
      }

    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast.error(error.message || 'Failed to add team member');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStore = async () => {
    if (!currentStore || !storeName.trim()) {
      toast.error('Store name is required');
      return;
    }

    // Validate tax rate
    const taxRate = parseFloat(storeTaxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      toast.error('Tax rate must be a valid percentage between 0 and 100');
      return;
    }

    // Validate email if provided
    if (storeEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setUpdatingStore(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName.trim(),
          address: storeAddress.trim() || null,
          phone: storePhone.trim() || null,
          email: storeEmail.trim() || null,
          currency: storeCurrency,
          tax_rate: taxRate / 100, // Convert percentage to decimal
          updated_at: new Date().toISOString()
        })
        .eq('id', currentStore.id);

      if (error) throw error;

      // Log the activity
      await teamMemberLogs.updated(
        currentStore.id,
        user?.user_metadata?.display_name || user?.email || 'Store Owner',
        'Store Settings',
        {
          name: storeName !== currentStore.name ? { from: currentStore.name, to: storeName } : undefined,
          address: storeAddress !== currentStore.address ? { from: currentStore.address, to: storeAddress } : undefined,
          phone: storePhone !== currentStore.phone ? { from: currentStore.phone, to: storePhone } : undefined,
          email: storeEmail !== currentStore.email ? { from: currentStore.email, to: storeEmail } : undefined,
          currency: storeCurrency !== currentStore.currency ? { from: currentStore.currency, to: storeCurrency } : undefined,
          tax_rate: storeTaxRate !== (currentStore.tax_rate * 100).toString() ? { from: `${currentStore.tax_rate * 100}%`, to: `${storeTaxRate}%` } : undefined
        },
        user?.id
      );

      toast.success('Store settings updated successfully!');

      // Refresh store data
      await refreshStores();

    } catch (error: any) {
      console.error('Error updating store:', error);
      toast.error(error.message || 'Failed to update store settings');
    } finally {
      setUpdatingStore(false);
    }
  };

  const fetchActivityLogs = async () => {
    if (!currentStore) return;

    setLogsLoading(true);
    try {
      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false })
        .limit(50); // Get last 50 activities

      if (error) throw error;
      setActivityLogs(logs || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const generatePin = async () => {
    if (!currentStore) return;

    let newPin: string;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate a unique PIN
    do {
      newPin = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;

      // Check if PIN already exists in this store
      const { data: existingPin } = await supabase
        .from('store_members')
        .select('id')
        .eq('store_id', currentStore.id)
        .eq('pin', newPin)
        .maybeSingle();

      if (!existingPin) {
        setMemberPin(newPin);
        toast.success(`Generated PIN: ${newPin}`);
        return;
      }
    } while (attempts < maxAttempts);

    toast.error('Unable to generate unique PIN. Please try again.');
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberPhone(member.phone || '');
    setMemberEmail(member.email || '');
    setMemberRole(member.role as 'manager' | 'cashier');
    setMemberPin(member.pin || '');
    setShowPin(false);
    setShowEditMemberDialog(true);
  };

  const handleUpdateMember = async () => {
    if (!currentStore || !editingMember || !memberName.trim() || !memberPhone.trim() || !memberPin.trim()) {
      toast.error('Please fill in all required fields (Name, Phone, PIN)');
      return;
    }

    if (memberPin.length !== 4 || !/^\d{4}$/.test(memberPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(memberPhone.replace(/[\s\-\(\)]/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setEditing(true);
    try {
      // Check if PIN is already in use by another member
      const { data: existingPin } = await supabase
        .from('store_members')
        .select('id')
        .eq('store_id', currentStore.id)
        .eq('pin', memberPin)
        .neq('id', editingMember.id)
        .maybeSingle();

      if (existingPin) {
        toast.error('This PIN is already in use. Please choose a different PIN.');
        return;
      }

      // Update team member
      const { error: memberError } = await supabase
        .from('store_members')
        .update({
          name: memberName,
          phone: memberPhone,
          email: memberEmail.trim() || null,
          role: memberRole,
          pin: memberPin
        })
        .eq('id', editingMember.id);

      if (memberError) throw memberError;

      // Log the activity
      const changes = {
        name: memberName !== editingMember.name ? { from: editingMember.name, to: memberName } : undefined,
        phone: memberPhone !== editingMember.phone ? { from: editingMember.phone, to: memberPhone } : undefined,
        email: memberEmail !== editingMember.email ? { from: editingMember.email, to: memberEmail } : undefined,
        role: memberRole !== editingMember.role ? { from: editingMember.role, to: memberRole } : undefined,
        pin: memberPin !== editingMember.pin ? 'PIN updated' : undefined
      };

      // Filter out undefined changes
      const actualChanges = Object.fromEntries(
        Object.entries(changes).filter(([_, value]) => value !== undefined)
      );

      await teamMemberLogs.updated(
        currentStore.id,
        user?.user_metadata?.display_name || user?.email || 'Store Owner',
        memberName,
        actualChanges,
        user?.id
      );

      toast.success(`${memberName} has been updated successfully!`);

      // Reset form and close dialog
      setMemberName('');
      setMemberPhone('');
      setMemberEmail('');
      setMemberRole('cashier');
      setMemberPin('');
      setShowPin(false);
      setEditingMember(null);
      setShowEditMemberDialog(false);

      // Refresh team members list and activity logs if on activity tab
      fetchTeamMembers();
      if (activeTab === 'activity') {
        fetchActivityLogs();
      }

    } catch (error: any) {
      console.error('Error updating team member:', error);
      toast.error(error.message || 'Failed to update team member');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteMember = (member: TeamMember) => {
    setDeletingMember(member);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMember = async () => {
    if (!deletingMember) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('store_members')
        .delete()
        .eq('id', deletingMember.id);

      if (error) throw error;

      // Log the activity
      await teamMemberLogs.deleted(
        currentStore.id,
        user?.user_metadata?.display_name || user?.email || 'Store Owner',
        deletingMember.name,
        deletingMember.role,
        user?.id
      );

      toast.success(`${deletingMember.name} has been removed from the team.`);
      setShowDeleteDialog(false);
      setDeletingMember(null);

      // Refresh team members list and activity logs if on activity tab
      fetchTeamMembers();
      if (activeTab === 'activity') {
        fetchActivityLogs();
      }

    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast.error(error.message || 'Failed to remove team member');
    } finally {
      setDeleting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'manager': return <UserCog className="w-4 h-4" />;
      case 'cashier': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    // Use shadcn badge variants only
    switch (role) {
      case 'owner': return 'default' as const;
      case 'manager': return 'secondary' as const;
      case 'cashier': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'owner':
        return ['Full System Access', 'Team Management', 'Store Settings', 'Financial Reports', 'Data Export'];
      case 'manager':
        return ['POS Operations', 'Inventory Management', 'Customer Management', 'Sales Reports', 'Layby Management'];
      case 'cashier':
        return ['POS Operations', 'Basic Customer Info', 'Process Transactions'];
      default:
        return [];
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your store settings and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="team" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2" disabled={!isOwner && userRole !== 'manager'}>
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Team Roles & Permissions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Overview of user roles and their access levels in your store
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Total Members</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="ml-1">
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of active team members including owners, managers, and cashiers</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-2xl font-bold text-foreground">{roleStats.total}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Owners</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="ml-1">
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Store owners with full system access and team management capabilities</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-2xl font-bold text-foreground">{roleStats.owner}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <UserCog className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Managers</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="ml-1">
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Managers with operational control over inventory, customers, and sales reporting</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-2xl font-bold text-foreground">{roleStats.manager}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Cashiers</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="ml-1">
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Front-line staff focused on POS operations and customer transactions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-2xl font-bold text-foreground">{roleStats.cashier}</div>
              </div>
            </div>



          {/* Current Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Current Team Members</h3>
              <div className="flex items-center gap-3">
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
                    Loading...
                  </div>
                )}
                {isOwner && (
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
                        <DialogDescription>
                          Create a new team member role with PIN-based access to your store.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="member-name">Full Name *</Label>
                          <Input
                            id="member-name"
                            placeholder="Enter team member's full name"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="member-phone">Phone Number *</Label>
                          <Input
                            id="member-phone"
                            type="tel"
                            placeholder="Enter phone number"
                            value={memberPhone}
                            onChange={(e) => setMemberPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="member-email">Email Address (Optional)</Label>
                          <Input
                            id="member-email"
                            type="email"
                            placeholder="Enter email address (optional)"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="member-role">Role</Label>
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
                          <Label htmlFor="member-pin">4-Digit PIN *</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id="member-pin"
                                type={showPin ? "text" : "password"}
                                placeholder="Enter 4-digit PIN"
                                value={memberPin}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  setMemberPin(value);
                                }}
                                maxLength={4}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                disabled={adding}
                              >
                                {showPin ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={generatePin}
                              disabled={adding}
                            >
                              Generate
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This PIN will be used for quick login access
                          </p>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleAddMember}
                            disabled={adding || !memberName.trim() || !memberPhone.trim() || memberPin.length !== 4}
                            className="flex-1"
                          >
                            {adding ? 'Adding...' : 'Add Member'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddMemberDialog(false);
                              setShowPin(false);
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Edit Member Dialog */}
            <Dialog open={showEditMemberDialog} onOpenChange={setShowEditMemberDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Team Member</DialogTitle>
                  <DialogDescription>
                    Update team member information and access settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-member-name">Full Name *</Label>
                    <Input
                      id="edit-member-name"
                      placeholder="Enter team member's full name"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-member-phone">Phone Number *</Label>
                    <Input
                      id="edit-member-phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-member-email">Email Address (Optional)</Label>
                    <Input
                      id="edit-member-email"
                      type="email"
                      placeholder="Enter email address (optional)"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-member-role">Role</Label>
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
                    <Label htmlFor="edit-member-pin">4-Digit PIN *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="edit-member-pin"
                          type={showPin ? "text" : "password"}
                          placeholder="Enter 4-digit PIN"
                          value={memberPin}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setMemberPin(value);
                          }}
                          maxLength={4}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          disabled={editing}
                        >
                          {showPin ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePin}
                        disabled={editing}
                      >
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This PIN will be used for quick login access
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleUpdateMember}
                      disabled={editing || !memberName.trim() || !memberPhone.trim() || memberPin.length !== 4}
                      className="flex-1"
                    >
                      {editing ? 'Updating...' : 'Update Member'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEditMemberDialog(false);
                        setShowPin(false);
                        setEditingMember(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {teamMembers.length === 0 && !loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No team members found</p>
                <p className="text-sm">Add team members to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {member.is_active ? (
                          <UserCheck className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <UserX className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {(isOwner || userRole === 'manager') && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
          </TabsContent>

          {/* Store Settings Tab */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Information
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your store's basic information and settings
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="store-name">Store Name *</Label>
                        <Input
                          id="store-name"
                          placeholder="Enter store name"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-address">Address</Label>
                        <Input
                          id="store-address"
                          placeholder="Enter store address"
                          value={storeAddress}
                          onChange={(e) => setStoreAddress(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-phone">Phone Number</Label>
                        <Input
                          id="store-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={storePhone}
                          onChange={(e) => setStorePhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-email">Email Address</Label>
                        <Input
                          id="store-email"
                          type="email"
                          placeholder="Enter email address"
                          value={storeEmail}
                          onChange={(e) => setStoreEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Regional Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Regional Settings</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="store-currency">Currency</Label>
                        <Select value={storeCurrency} onValueChange={setStoreCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                            <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                            <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                            <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                            <SelectItem value="CNY">CNY (¥) - Chinese Yuan</SelectItem>
                            <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-tax-rate">Tax Rate (%)</Label>
                        <Input
                          id="store-tax-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="Enter tax rate"
                          value={storeTaxRate}
                          onChange={(e) => setStoreTaxRate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter as percentage (e.g., 8.25 for 8.25%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Code Display */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Store Access</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Store Code</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (currentStore?.store_code) {
                            navigator.clipboard.writeText(currentStore.store_code);
                            toast.success('Store code copied to clipboard!');
                          }
                        }}
                        className="h-8"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="font-mono text-xl font-bold text-primary mb-2">
                      {currentStore?.store_code}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Team members use this code to access your store
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="border-t pt-6">
                  <Button
                    onClick={handleUpdateStore}
                    disabled={updatingStore || !storeName.trim()}
                    className="w-full md:w-auto"
                  >
                    {updatingStore ? 'Updating...' : 'Update Store Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure accepted payment methods for your store
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Payment settings coming soon</p>
                  <p className="text-sm">Set up credit cards, cash, and digital payment options</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage how and when you receive notifications
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Notification settings coming soon</p>
                  <p className="text-sm">Configure alerts for low stock, sales reports, and more</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab - Only for owners and managers */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Team Activity Log
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activityLogs.length === 0) {
                        fetchActivityLogs();
                      } else {
                        fetchActivityLogs();
                      }
                    }}
                    disabled={logsLoading}
                  >
                    {logsLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track team member actions and changes in your store
                </p>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading activity logs...</span>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activity logs found</p>
                    <p className="text-sm">Team actions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {log.action_type.includes('added') && <UserPlus className="w-4 h-4 text-green-600" />}
                          {log.action_type.includes('updated') && <Edit className="w-4 h-4 text-blue-600" />}
                          {log.action_type.includes('deleted') && <Trash2 className="w-4 h-4 text-red-600" />}
                          {log.action_type.includes('login') && <UserCheck className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View details
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchActivityLogs}
                        disabled={logsLoading}
                      >
                        Refresh Logs
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingMember?.name}</strong> from your team?
              This action cannot be undone and they will lose access to the store immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
}


