import { useStores, useCurrentStore, useSelectStore, useStoreLoading } from '@/stores/storeStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Crown, UserCheck, Store, ArrowRight, LogOut, Plus, MapPin } from 'lucide-react';
import { useUser, useSignOut } from '@/stores/authStore';
import { CreateStoreDialog } from './CreateStoreDialog';
import { StoreSelectorSkeleton, CompactStoreSelectorSkeleton } from '@/components/ui/store-selector-skeleton';

export function PremiumStoreSelector() {
  const stores = useStores();
  const currentStore = useCurrentStore();
  const selectStore = useSelectStore();
  const loading = useStoreLoading();
  const user = useUser();
  const signOut = useSignOut();

  // Show skeleton while loading stores (only if no stores are available yet)
  if (loading && stores.length === 0) {
    return <CompactStoreSelectorSkeleton />;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-amber-600" />;
      case 'manager':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'cashier':
        return <Users className="w-4 h-4 text-primary" />;
      default:
        return <Building2 className="w-4 h-4 text-muted-foreground" />;
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

  // Minimal Flat Header
  const Header = () => (
    <div className="border-b border-border/40">
      <div className="container flex h-16 items-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <Store className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-medium">Storefy</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  // Minimal Footer
  const Footer = () => (
    <div className="border-t border-border/40 mt-auto">
      <div className="container py-6">
        <p className="text-center text-xs text-muted-foreground">
          © 2024 Storefy
        </p>
      </div>
    </div>
  );



  if (stores.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {Header()}

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary rounded mx-auto mb-4 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-medium">Welcome to Storefy</h1>
              <p className="text-sm text-muted-foreground">
                Create your first store to get started
              </p>
            </div>

            <CreateStoreDialog />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">What's included:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Inventory management</div>
                <div>• Point of sale system</div>
                <div>• Customer management</div>
                <div>• Sales analytics</div>
              </div>
            </div>
          </div>
        </div>

        {Footer()}
      </div>
    );
  }

  if (stores.length === 1) {
    const singleStore = stores[0];

    return (
      <div className="min-h-screen flex flex-col bg-background">
        {Header()}

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary rounded mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-medium">Access Your Store</h1>
              <p className="text-sm text-muted-foreground">
                Click below to access your store dashboard
              </p>
            </div>

            <div
              className="border border-border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors space-y-4"
              onClick={() => {
                console.log('🖱️ Single store clicked:', singleStore.id, singleStore.name);
                selectStore(singleStore.id);
              }}
            >
              <div className="text-center space-y-2">
                <div className="w-6 h-6 bg-primary rounded mx-auto flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <h3 className="font-medium">{singleStore.name}</h3>
                {singleStore.address && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {singleStore.address.length > 30 ? `${singleStore.address.substring(0, 30)}...` : singleStore.address}
                  </p>
                )}
                <Badge variant={getRoleBadgeVariant(singleStore.role || 'owner')} className="text-xs">
                  {getRoleIcon(singleStore.role || 'owner')}
                  <span className="ml-1">
                    {singleStore.role === 'owner' ? 'Owner' : singleStore.role || 'Member'}
                  </span>
                </Badge>
              </div>
              <Button className="w-full">
                Access Store
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="text-center space-y-4">
              <p className="text-xs text-muted-foreground">
                Store selection required to continue
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Need another store?</p>
                <CreateStoreDialog trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Store
                  </Button>
                } />
              </div>
            </div>
          </div>
        </div>

        {Footer()}
      </div>
    );
  }

  // Multiple stores case
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {Header()}

      <div className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-medium">Select Your Store</h1>
            <p className="text-sm text-muted-foreground">
              Choose which store you'd like to manage
            </p>
          </div>

          {/* Add Store Button */}
          <div className="flex justify-center">
            <CreateStoreDialog trigger={
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Store
              </Button>
            } />
          </div>

          {/* Store List */}
          <div className="space-y-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className={`border border-border rounded-lg p-4 cursor-pointer transition-colors ${
                  currentStore?.id === store.id
                    ? 'bg-primary/5 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                console.log('🖱️ Store clicked:', store.id, store.name);
                selectStore(store.id);
              }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                    currentStore?.id === store.id
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}>
                    <Building2 className={`w-4 h-4 ${
                      currentStore?.id === store.id
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{store.name}</h3>
                        {store.address && (
                          <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              {store.address.length > 40 ? `${store.address.substring(0, 40)}...` : store.address}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant={getRoleBadgeVariant(store.role || 'owner')} className="text-xs">
                          {getRoleIcon(store.role || 'owner')}
                          <span className="ml-1">
                            {store.role === 'owner' ? 'Owner' : store.role || 'Member'}
                          </span>
                        </Badge>

                        {currentStore?.id === store.id && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help Section */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Select a store above to access the application
            </p>
          </div>
        </div>
      </div>

      {Footer()}
    </div>
  );
}
