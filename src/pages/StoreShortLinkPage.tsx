import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { pinSessionClient } from '@/lib/pinSessionClient';
import { toast } from 'sonner';
import { Store, Users, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export function StoreShortLinkPage() {
  const { storeCode } = useParams<{ storeCode: string }>();
  const navigate = useNavigate();
  
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (storeCode) {
      fetchStore();
    }
  }, [storeCode]);

  const fetchStore = async () => {
    if (!storeCode) return;

    setLoading(true);
    try {
      const { data: storeData, error } = await supabase
        .from('stores')
        .select('id, name, store_code')
        .eq('store_code', storeCode.toUpperCase())
        .maybeSingle();

      if (error || !storeData) {
        toast.error('Invalid store code. Please check the link.');
        navigate('/auth');
        return;
      }

      setStore(storeData);
    } catch (error) {
      console.error('Error fetching store:', error);
      toast.error('Failed to load store information');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberName.trim() || !pin.trim()) {
      toast.error('Please enter both name and PIN');
      return;
    }

    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    setIsLoggingIn(true);
    try {
      // Find store member by PIN in this specific store
      const { data: memberData, error } = await supabase
        .from('store_members')
        .select(`
          id,
          store_id,
          user_id,
          role,
          pin,
          name,
          is_active,
          stores (name, id)
        `)
        .eq('pin', pin)
        .eq('store_id', store.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !memberData) {
        toast.error('Invalid name or PIN');
        return;
      }

      // Check name - use store_members.name for team members, or profile.display_name for users
      let displayName = '';
      if (memberData.user_id) {
        // This is a full user - get display name from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', memberData.user_id)
          .maybeSingle();
        displayName = profileData?.display_name || '';
      } else {
        // This is a team member - use name from store_members
        displayName = memberData.name || '';
      }

      // Check if the name matches (case insensitive)
      if (displayName.toLowerCase() !== memberName.toLowerCase()) {
        toast.error('Invalid name or PIN');
        return;
      }

      // Store member session info using session manager for proper timeout handling
      const { sessionManager } = await import('@/lib/sessionManager');
      sessionManager.createPinSession({
        member_id: memberData.id,
        user_id: memberData.user_id,
        store_id: memberData.store_id,
        role: memberData.role,
        name: displayName,
        store_name: memberData.stores.name,
        login_time: new Date().toISOString()
      });

      // Refresh PIN session client to load new session
      pinSessionClient.refreshPinSession();

      // Trigger custom event to notify contexts of PIN session change
      window.dispatchEvent(new CustomEvent('pin-session-changed'));

      toast.success(`Welcome back, ${displayName}!`);

      // Use navigate for better UX, fallback to reload if needed
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const goToSignIn = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading store information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The store code in this link is invalid or expired.
              </p>
              <Button onClick={goToSignIn} className="w-full">
                Go to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Store className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Quick Store Access</CardTitle>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{store.name}</h3>
            <Badge variant="outline" className="font-mono">
              {store.store_code}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your team member credentials to access the store
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="member-name"
                  type="text"
                  placeholder="Enter your name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="pl-10"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">4-Digit PIN</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(value);
                  }}
                  maxLength={4}
                  className="pr-10"
                  disabled={isLoggingIn}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  disabled={isLoggingIn}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn || !memberName.trim() || pin.length !== 4}
            >
              {isLoggingIn ? 'Signing In...' : 'Access Store'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have team member access?
            </p>
            <Button 
              variant="outline" 
              onClick={goToSignIn}
              className="w-full"
              disabled={isLoggingIn}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Regular Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StoreShortLinkPage;
