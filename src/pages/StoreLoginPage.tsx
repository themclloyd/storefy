import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, KeyRound, ArrowLeft, AlertCircle, Shield, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

export default function StoreLoginPage() {
  const [memberName, setMemberName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { storeCode } = useParams();

  useEffect(() => {
    document.title = `Store Login - ${storeCode || 'Storefy'}`;
  }, [storeCode]);

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !pin.trim()) return;

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
          *,
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

      // Get the user's profile separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', memberData.user_id)
        .maybeSingle();

      // Check if the name matches
      const displayName = profileData?.display_name || '';
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

      toast.success(`Welcome to ${memberData.stores.name}, ${displayName}!`);
      navigate('/pos'); // Direct to POS system
    } catch (error: any) {
      toast.error(`Login failed: ${  error.message}`);
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
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">Store Access</h1>
            <p className="text-base text-primary-foreground/90 leading-relaxed">
              Access your specific store location with your personal credentials.
            </p>
            {storeCode && (
              <div className="bg-primary-foreground/10 rounded-lg p-3 border border-primary-foreground/20">
                <p className="text-xs text-primary-foreground/80 mb-1">Store Code</p>
                <p className="text-lg font-bold text-primary-foreground">{storeCode.toUpperCase()}</p>
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/60" />
              <span>Store-Specific Access</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-white/60" />
              <span>Personal Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-white/60" />
              <span>Secure PIN Login</span>
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
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Store Access</h1>
            {storeCode && (
              <p className="text-xs text-muted-foreground mt-1">
                Store: <span className="font-medium">{storeCode.toUpperCase()}</span>
              </p>
            )}
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Access Store
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your name and PIN to access {storeCode?.toUpperCase()}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="memberName" className="text-sm font-medium text-foreground">
                Your Name
              </Label>
              <Input
                id="memberName"
                type="text"
                placeholder="Enter your full name"
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
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary-dark rounded-lg font-medium"
              disabled={loading}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Access Store
                </>
              )}
            </Button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Need Help?</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Contact your store manager for your PIN</p>
                <p>• Use your full name as registered</p>
                <p>• Store code: <span className="font-medium text-foreground">{storeCode?.toUpperCase()}</span></p>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-primary hover:text-primary/80 hover:bg-transparent text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Store Manager Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}