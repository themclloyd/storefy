import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Edit, Trash2, UserCheck, UserX, Crown, UserCog } from "lucide-react";
import { useCurrentStore } from "@/stores/storeStore";
import { SecureAction, SecureButton } from "@/components/auth/SecureAction";

// Import new modular stores
import {
  useTeamMembers,
  useTeamRoleStats,
  useTeamLoading,
  useTeamError,
  useTeamActions,
  type TeamMember
} from "@/stores/settings/teamStore";

import {
  useDialogState,
  useSettingsUIActions
} from "@/stores/settings/settingsUIStore";

// Import dialog components
import { TeamMemberDialog } from "./dialogs/TeamMemberDialog";

export function TeamManagementSimplified() {
  const currentStore = useCurrentStore();

  // Use modular stores
  const teamMembers = useTeamMembers();
  const roleStats = useTeamRoleStats();
  const loading = useTeamLoading();
  const error = useTeamError();
  const teamActions = useTeamActions();

  // UI state
  const addDialogOpen = useDialogState('addTeamMember');
  const editDialogOpen = useDialogState('editTeamMember');
  const uiActions = useSettingsUIActions();

  // Load team members on mount
  useEffect(() => {
    if (currentStore?.id) {
      teamActions.fetchMembers(currentStore.id);
    }
  }, [currentStore?.id, teamActions]);

  const handleAddMember = () => {
    uiActions.openDialog('addTeamMember');
  };

  const handleEditMember = (member: TeamMember) => {
    uiActions.setSelectedTeamMember(member.id);
    uiActions.openDialog('editTeamMember');
  };

  const handleDeleteMember = (member: TeamMember) => {
    uiActions.showConfirmation({
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${member.name} from your team? This action cannot be undone.`,
      onConfirm: () => {
        teamActions.deleteMember(member.id);
        uiActions.hideConfirmation();
      },
    });
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-destructive mb-2">Error loading team members</div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button 
              onClick={() => currentStore?.id && teamActions.fetchMembers(currentStore.id)}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
              <Button onClick={handleAddMember}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
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
                    <SecureAction permission="manage_users">
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
                    </SecureAction>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TeamMemberDialog
        mode="add"
        open={addDialogOpen}
        onClose={() => uiActions.closeDialog('addTeamMember')}
      />

      <TeamMemberDialog
        mode="edit"
        open={editDialogOpen}
        onClose={() => {
          uiActions.closeDialog('editTeamMember');
          uiActions.setSelectedTeamMember(null);
        }}
      />
    </>
  );
}
