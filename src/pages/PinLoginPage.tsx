
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, User, KeyRound, ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { pinSessionClient } from '@/lib/pinSessionClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function PinLoginPage() {
  const [storeCode, setStoreCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "PIN Login - Storefy";
  }, []);

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeCode.trim() || !memberName.trim() || !pin.trim()) return;

    setLoading(true);
    try {
      // First, find the store by code
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('store_code', storeCode?.toUpperCase() || '')
        .maybeSingle();

      if (storeError || !storeData) {
        toast.error('Invalid store code. Please check with your manager.');
        return;
      }

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
        .eq('store_id', storeData.id)
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

      // Store member session info in localStorage for PIN-based access
      localStorage.setItem('pin_session', JSON.stringify({
        member_id: memberData.id,
        user_id: memberData.user_id,
        store_id: memberData.store_id,
        role: memberData.role,
        name: displayName,
        store_name: memberData.stores.name,
        login_time: new Date().toISOString()
      }));

      // Refresh PIN session client to load new session
      pinSessionClient.refreshPinSession();

      // Trigger custom event to notify contexts of PIN session change
      window.dispatchEvent(new CustomEvent('pin-session-changed'));

      toast.success(`Welcome, ${displayName}!`);

      // Use navigate for better UX, fallback to reload if needed
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-8 text-primary-foreground">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">Team Access</h1>
            <p className="text-base text-primary-foreground/90 leading-relaxed">
              Quick and secure access for team members. Enter your credentials to start working.
            </p>
          </div>
          <div className="space-y-2 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-foreground/60" />
              <span>Secure PIN Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary-foreground/60" />
              <span>Personal Access Control</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary-foreground/60" />
              <span>Store-Specific Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Team PIN Login</h1>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Team Member Access
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your store code, name, and PIN to access the system
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="storeCode" className="text-sm font-medium text-foreground">
                Store Code
              </Label>
              <Input
                id="storeCode"
                type="text"
                placeholder="Enter store code"
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value.toUpperCase())}
                required
                className="h-10 rounded-lg border-border uppercase"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="memberName" className="text-sm font-medium text-foreground">
                Name
              </Label>
              <Input
                id="memberName"
                type="text"
                placeholder="Enter your name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                required
                className="h-10 rounded-lg border-border"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pin" className="text-sm font-medium text-foreground">
                4-Digit PIN
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                pattern="[0-9]{4}"
                required
                className="h-10 rounded-lg border-border text-center text-base tracking-widest"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10"
              disabled={loading}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-primary hover:text-primary/80 hover:bg-transparent text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Main Login
              </Button>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Access Information</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Contact your store manager for store code and PIN</p>
                <p>• Use your name as registered in the system</p>
                <p>• Access level depends on your assigned role</p>
                <p>• Use store link if you have direct access URL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
