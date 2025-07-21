import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Eye, EyeOff, Edit, Trash2, UserCheck, UserX, Crown, UserCog, UserPlus } from "lucide-react";
import { useCurrentStore, useStoreStore } from "@/stores/storeStore";
import { useUser } from "@/stores/authStore";
import { SecureAction, SecureButton } from "@/components/auth/SecureAction";
import { teamMemberLogs } from "@/lib/activityLogger";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useSettingsStore,
  useTeamMembers,
  useRoleStats,
  type TeamMember
} from "@/stores/settingsStore";

export function TeamManagement() {
  const currentStore = useCurrentStore();
  const user = useUser();
  const { isOwner, userRole } = useStoreStore();

  // Use Zustand store state
  const teamMembers = useTeamMembers();
  const roleStats = useRoleStats();
  const loading = useSettingsStore(state => state.loading);
  const showAddMemberDialog = useSettingsStore(state => state.showAddTeamMemberDialog);
  
  // Actions from Zustand
  const setShowAddMemberDialog = useSettingsStore(state => state.setShowAddTeamMemberDialog);
  const fetchTeamMembers = useSettingsStore(state => state.fetchTeamMembers);
  const addTeamMember = useSettingsStore(state => state.addTeamMember);

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
    } catch (error) {
      console.error('Error adding team member:', error);
    } finally {
      setAdding(false);
    }
  };

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setMemberPin(pin);
  };

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
    switch (role) {
      case 'owner': return 'default' as const;
      case 'manager': return 'secondary' as const;
      case 'cashier': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading team members...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Management
              <Badge variant="outline" className="ml-2">
                {roleStats.total} {roleStats.total === 1 ? 'Member' : 'Members'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your store team members and their access levels
            </p>
          </div>
          <SecureAction permission="manage_users">
            <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Create a new team member account with role-based access.
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
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
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
      </CardContent>
    </Card>
  );
}
