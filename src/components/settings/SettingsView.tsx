
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Users, Shield, Eye, EyeOff, Edit, Trash2, UserCheck, UserX, Crown, UserCog, HelpCircle, UserPlus, Store, CreditCard, Bell, Activity, Copy } from "lucide-react";
import { useCurrentStore, useStoreStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { SecureAction, SecureButton } from "@/components/auth/SecureAction";
import { teamMemberLogs } from "@/lib/activityLogger";
import { clearTaxCache, percentageToDecimal, isValidTaxRate, WORLD_CURRENCIES } from "@/lib/taxUtils";
import { PaymentMethodsSettings } from "./PaymentMethodsSettings";
import { ShowcaseSettings } from "./ShowcaseSettings";
import { PrivacySettings } from "@/components/analytics/ConsentBanner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useSettingsStore,
  useTeamMembers,
  useActivityLogs,
  useRoleStats,
  useStoreSettings,
  type TeamMember
} from "@/stores/settingsStore";
import { PageHeader, PageLayout } from "@/components/common/PageHeader";



export function SettingsView() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { isOwner, userRole, updateCurrentStore } = useStoreStore();

  // Use Zustand store state
  const teamMembers = useTeamMembers();
  const activityLogs = useActivityLogs();
  const roleStats = useRoleStats();
  const storeSettings = useStoreSettings();
  const showcaseSettings = useSettingsStore(state => state.showcaseSettings);
  const loading = useSettingsStore(state => state.loading);
  const updatingStore = useSettingsStore(state => state.updatingStore);
  const currentTab = useSettingsStore(state => state.currentTab);

  // Dialog states from Zustand
  const showAddMemberDialog = useSettingsStore(state => state.showAddTeamMemberDialog);

  // Actions from Zustand
  const setCurrentTab = useSettingsStore(state => state.setCurrentTab);
  const setShowAddMemberDialog = useSettingsStore(state => state.setShowAddTeamMemberDialog);
  const setStoreSettings = useSettingsStore(state => state.setStoreSettings);
  const fetchTeamMembers = useSettingsStore(state => state.fetchTeamMembers);
  const fetchActivityLogs = useSettingsStore(state => state.fetchActivityLogs);
  const addTeamMember = useSettingsStore(state => state.addTeamMember);
  const updateStoreSettings = useSettingsStore(state => state.updateStoreSettings);

  useEffect(() => {
    if (currentStore?.id) {
      fetchTeamMembers(currentStore.id);
    }
  }, [currentStore?.id, fetchTeamMembers]);

  useEffect(() => {
    if (currentTab === 'activity' && currentStore?.id && activityLogs.length === 0) {
      fetchActivityLogs(currentStore.id);
    }
  }, [currentTab, currentStore?.id, activityLogs.length, fetchActivityLogs]);

  useEffect(() => {
    if (currentStore) {
      setStoreSettings({
        storeName: currentStore.name || '',
        storeAddress: currentStore.address || '',
        storePhone: currentStore.phone || '',
        storeEmail: currentStore.email || '',
        storeCurrency: currentStore.currency || 'MWK',
        storeTaxRate: currentStore.tax_rate?.toString() || '8.25',
      });
    }
  }, [currentStore, setStoreSettings]);



  // Local form state for add member dialog
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'manager' | 'cashier'>('cashier');
  const [memberPin, setMemberPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAddMember = async () => {
    if (!currentStore?.id || !memberName.trim() || !memberPhone.trim() || !memberPin.trim()) {
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
      const memberData = {
        name: memberName,
        phone: memberPhone,
        email: memberEmail.trim() || null,
        role: memberRole,
        pin: memberPin,
        is_active: true,
        created_by: user?.id,
      };

      await addTeamMember(currentStore.id, memberData);

      // Reset form and close dialog
      setMemberName('');
      setMemberPhone('');
      setMemberEmail('');
      setMemberRole('cashier');
      setMemberPin('');
      setShowPin(false);
      setShowAddMemberDialog(false);

      // Log the activity
      await teamMemberLogs.added(
        currentStore.id,
        user?.user_metadata?.display_name || user?.email || 'Store Owner',
        memberName,
        memberRole,
        user?.id
      );

      // Refresh activity logs if on activity tab
      if (currentTab === 'activity') {
        fetchActivityLogs(currentStore.id);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStore = async () => {
    if (!currentStore?.id || !storeSettings.storeName.trim()) {
      toast.error('Store name is required');
      return;
    }

    // Validate tax rate
    const taxRateDecimal = percentageToDecimal(parseFloat(storeSettings.storeTaxRate));
    if (isNaN(taxRateDecimal) || !isValidTaxRate(taxRateDecimal)) {
      toast.error('Tax rate must be a valid percentage between 0 and 100');
      return;
    }

    // Validate email if provided
    if (storeSettings.storeEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeSettings.storeEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    await updateStoreSettings(currentStore.id, storeSettings);

    // Clear tax cache since tax rate might have changed
    clearTaxCache();

    // Update the current store in context
    updateCurrentStore({
      name: storeSettings.storeName.trim(),
      address: storeSettings.storeAddress.trim() || undefined,
      phone: storeSettings.storePhone.trim() || undefined,
      email: storeSettings.storeEmail.trim() || undefined,
      currency: storeSettings.storeCurrency,
      tax_rate: taxRateDecimal,
    });
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

  // These functions will be implemented when needed
  const handleEditMember = (member: TeamMember) => {
    // TODO: Implement edit functionality using store
    console.log('Edit member:', member);
  };

  const handleDeleteMember = (member: TeamMember) => {
    // TODO: Implement delete functionality using store
    console.log('Delete member:', member);
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



  return (
    <TooltipProvider>
      <PageLayout className="max-w-7xl mx-auto">
        <PageHeader
          title="Settings"
          description="Manage your store settings and preferences"
          icon={<Settings className="w-8 h-8 text-primary" />}
          actions={
            currentStore && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const showcaseUrl = `${window.location.origin}/showcase/${currentStore.id}`;
                      window.open(showcaseUrl, '_blank');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    View Store Catalog
                    {showcaseSettings.enableShowcase && (
                      <Badge variant="default" className="ml-1 text-xs">
                        Live
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showcaseSettings.enableShowcase ? 'View your public store catalog' : 'Enable showcase in settings to make your catalog public'}</p>
                </TooltipContent>
              </Tooltip>
            )
          }
        />

        <Tabs defaultValue="team" value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="showcase" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Showcase
              {showcaseSettings.enableShowcase && (
                <Badge variant="default" className="ml-1 text-xs">
                  Live
                </Badge>
              )}
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
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-6">
            {!currentStore ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <Store className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Store Selected</h3>
                      <p className="text-muted-foreground mb-4">
                        Please select or create a store to manage team members.
                      </p>
                      <Button onClick={() => window.location.href = '/app/stores'}>
                        Go to Store Management
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
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
                <SecureAction permission="manage_users">
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
                </SecureAction>
              </div>
            </div>

            {/* Edit and Delete functionality will be implemented later */}

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
                          <SecureButton
                            permission="manage_users"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </SecureButton>
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

      {/* Store Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Store Code & PIN Login
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Share these with team members for store access
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Store Code */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Store Code</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-lg font-bold">
                {currentStore?.store_code || 'No store selected'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentStore?.store_code) {
                    navigator.clipboard.writeText(currentStore.store_code);
                    toast.success('Store code copied!');
                  } else {
                    toast.error('No store selected');
                  }
                }}
                disabled={!currentStore?.store_code}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Store Login Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Store Login Link</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {currentStore?.store_code
                  ? `${window.location.origin}/store/${currentStore.store_code}`
                  : 'No store selected'
                }
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentStore?.store_code) {
                    const storeLink = `${window.location.origin}/store/${currentStore.store_code}`;
                    navigator.clipboard.writeText(storeLink);
                    toast.success('Store link copied!');
                  } else {
                    toast.error('No store selected');
                  }
                }}
                disabled={!currentStore?.store_code}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* PIN Login Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">PIN Login Link</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {window.location.origin}/pin-login
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pinLoginLink = `${window.location.origin}/pin-login`;
                  navigator.clipboard.writeText(pinLoginLink);
                  toast.success('PIN login link copied!');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
              </>
            )}
          </TabsContent>

          {/* Store Settings Tab */}
          <TabsContent value="store" className="space-y-6">
            {!currentStore ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <Store className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Store Selected</h3>
                      <p className="text-muted-foreground mb-4">
                        Please select or create a store to manage store settings.
                      </p>
                      <Button onClick={() => window.location.href = '/app/stores'}>
                        Go to Store Management
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
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
                          value={storeSettings.storeName}
                          onChange={(e) => setStoreSettings({ storeName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-address">Address</Label>
                        <Input
                          id="store-address"
                          placeholder="Enter store address"
                          value={storeSettings.storeAddress}
                          onChange={(e) => setStoreSettings({ storeAddress: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-phone">Phone Number</Label>
                        <Input
                          id="store-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={storeSettings.storePhone}
                          onChange={(e) => setStoreSettings({ storePhone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-email">Email Address</Label>
                        <Input
                          id="store-email"
                          type="email"
                          placeholder="Enter email address"
                          value={storeSettings.storeEmail}
                          onChange={(e) => setStoreSettings({ storeEmail: e.target.value })}
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
                        <Select value={storeSettings.storeCurrency} onValueChange={(value) => setStoreSettings({ storeCurrency: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {Object.entries(WORLD_CURRENCIES).map(([code, info]) => (
                              <SelectItem key={code} value={code}>
                                {code} ({info.symbol}) - {info.name}
                              </SelectItem>
                            ))}
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
                          value={storeSettings.storeTaxRate}
                          onChange={(e) => setStoreSettings({ storeTaxRate: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter as percentage (e.g., 8.25 for 8.25%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Save Button */}
                <div className="border-t pt-6">
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUpdateStore();
                    }}
                    disabled={updatingStore || !storeSettings.storeName.trim()}
                    className="w-full md:w-auto"
                  >
                    {updatingStore ? 'Updating...' : 'Update Store Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          {/* Public Showcase Tab */}
          <TabsContent value="showcase" className="space-y-6">
            {!currentStore ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <Globe className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Store Selected</h3>
                      <p className="text-muted-foreground mb-4">
                        Please select or create a store to manage showcase settings.
                      </p>
                      <Button onClick={() => window.location.href = '/app/stores'}>
                        Go to Store Management
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ShowcaseSettings />
            )}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-6">
            {!currentStore ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <CreditCard className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Store Selected</h3>
                      <p className="text-muted-foreground mb-4">
                        Please select or create a store to manage payment methods.
                      </p>
                      <Button onClick={() => window.location.href = '/app/stores'}>
                        Go to Store Management
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PaymentMethodsSettings />
            )}
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
            {!currentStore ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Store Selected</h3>
                      <p className="text-muted-foreground mb-4">
                        Please select or create a store to view activity logs.
                      </p>
                      <Button onClick={() => window.location.href = '/app/stores'}>
                        Go to Store Management
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
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
                      if (currentStore?.id) {
                        fetchActivityLogs(currentStore.id);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track team member actions and changes in your store
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
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
                          {log.action_type?.includes('added') && <UserPlus className="w-4 h-4 text-green-600" />}
                          {log.action_type?.includes('updated') && <Edit className="w-4 h-4 text-blue-600" />}
                          {log.action_type?.includes('deleted') && <Trash2 className="w-4 h-4 text-red-600" />}
                          {log.action_type?.includes('login') && <UserCheck className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.action_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Action'}
                            </Badge>
                          </div>

                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => currentStore?.id && fetchActivityLogs(currentStore.id)}
                        disabled={loading}
                      >
                        Refresh Logs
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          {/* Analytics & Privacy Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Analytics Settings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage your data collection preferences and privacy settings
                  </p>
                </CardHeader>
                <CardContent>
                  <PrivacySettings />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Learn about the data we collect and how it helps improve your experience
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">What We Track</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Page views and navigation patterns</li>
                        <li>• Feature usage and interactions</li>
                        <li>• Performance metrics and load times</li>
                        <li>• Error tracking for improvements</li>
                        <li>• Business metrics (sales, inventory)</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Privacy Protection</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• No personal data without consent</li>
                        <li>• Anonymized user identifiers</li>
                        <li>• Secure data transmission (HTTPS)</li>
                        <li>• GDPR compliant data handling</li>
                        <li>• Easy consent withdrawal</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Analytics data helps us understand how Storefy is used, identify areas for improvement,
                      and ensure optimal performance. All data is processed securely and never shared with third parties.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete functionality will be implemented later */}
      </PageLayout>
    </TooltipProvider>
  );
}


