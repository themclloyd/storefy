import { useAuth } from '@/contexts/AuthContext';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedAccess';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Settings,
  LogOut,
  Crown,
  UserCheck,
  Users,
  ChevronDown
} from 'lucide-react';

interface UserMenuProps {
  onViewChange?: (view: string) => void;
}

export function UserMenu({ onViewChange }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { userRole } = useRoleBasedNavigation();

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const pinData = pinSession ? JSON.parse(pinSession) : null;

  const handleSignOut = async () => {
    // Clear PIN session if exists
    if (pinSession) {
      localStorage.removeItem('pin_session');
      window.location.href = '/pin-login';
      return;
    }

    await signOut();
  };

  const handleSettings = () => {
    if (onViewChange) {
      onViewChange('settings');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3 text-amber-600" />;
      case 'manager':
        return <UserCheck className="w-3 h-3 text-blue-600" />;
      case 'cashier':
        return <Users className="w-3 h-3 text-primary" />;
      default:
        return <User className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'cashier':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Get display name and email
  const displayName = pinData?.member_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = pinData ? null : user?.email;
  const displayRole = userRole?.role || 'member';

  // Get initials for avatar
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-12 w-full px-3 gap-3 hover:bg-accent/50 justify-start"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-medium truncate max-w-full">
              {displayName}
            </span>
            <Badge
              variant={getRoleBadgeVariant(displayRole)}
              className="text-xs h-4 px-2 mt-0.5"
            >
              {getRoleIcon(displayRole)}
              <span className="ml-1 text-xs capitalize">
                {displayRole}{pinData && " (PIN)"}
              </span>
            </Badge>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="pb-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {displayEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {displayEmail}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Badge variant={getRoleBadgeVariant(displayRole)} className="text-xs h-4 px-1">
                {getRoleIcon(displayRole)}
                <span className="ml-1 text-xs capitalize">
                  {displayRole}{pinData && " (PIN)"}
                </span>
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {pinSession ? "End Session" : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
