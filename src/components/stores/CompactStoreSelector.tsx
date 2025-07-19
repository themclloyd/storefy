import { useState } from 'react';
import { useStores, useCurrentStore, useSelectStore } from '@/stores/storeStore';
import { useUser } from '@/stores/authStore';
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
import { Building2, ChevronDown, Crown, UserCheck, Users, Check } from 'lucide-react';

export function CompactStoreSelector() {
  const stores = useStores();
  const currentStore = useCurrentStore();
  const selectStore = useSelectStore();
  const user = useUser();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3 text-amber-600" />;
      case 'manager':
        return <UserCheck className="w-3 h-3 text-blue-600" />;
      case 'cashier':
        return <Users className="w-3 h-3 text-primary" />;
      default:
        return <Building2 className="w-3 h-3 text-muted-foreground" />;
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

  if (!currentStore) {
    return null;
  }

  // If only one store, show as static button
  if (stores.length <= 1) {
    return (
      <Button
        variant="outline"
        className="h-9 px-3 gap-2 text-sm font-medium w-full justify-start cursor-default bg-muted/30"
        disabled
      >
        <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-left text-muted-foreground">{currentStore.name}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-3 gap-2 text-sm font-medium hover:bg-accent/50 w-full justify-start"
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate text-left">{currentStore.name}</span>
          <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Store
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => selectStore(store.id)}
            className="flex items-center justify-between p-3 cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                currentStore?.id === store.id
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}>
                <Building2 className={`w-3 h-3 ${
                  currentStore?.id === store.id
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{store.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant={getRoleBadgeVariant(store.role || 'owner')} className="text-xs h-4 px-1">
                    {getRoleIcon(store.role || 'owner')}
                    <span className="ml-1 text-xs">
                      {store.role === 'owner' ? 'Owner' : store.role || 'Member'}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>
            {currentStore?.id === store.id && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
