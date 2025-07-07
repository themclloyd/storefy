
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, User, KeyRound, ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function PinLoginPage() {
  const [memberName, setMemberName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "PIN Login - Storefy";
  }, []);

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !pin.trim()) return;

    setLoading(true);
    try {
      // Find store member by PIN
      const { data: memberData, error } = await supabase
        .from('store_members')
        .select(`
          *,
          stores (name, id)
        `)
        .eq('pin', pin)
        .eq('is_active', true)
        .single();

      if (error || !memberData) {
        toast.error('Invalid name or PIN');
        return;
      }

      // Get the user's profile separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', memberData.user_id)
        .single();

      // Check if the name matches
      const displayName = profileData?.display_name || '';
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

      toast.success(`Welcome, ${displayName}!`);
      navigate('/pos'); // Direct to POS system for quick access
    } catch (error: any) {
      toast.error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="max-w-md text-center space-y-8">
          <div className="w-20 h-20 bg-primary-foreground/20 rounded-3xl flex items-center justify-center mx-auto">
            <KeyRound className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Team Access</h1>
            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Quick and secure access for team members. Enter your credentials to start working.
            </p>
          </div>
          <div className="space-y-3 text-primary-foreground/80">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-foreground/60" />
              <span>Secure PIN Authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary-foreground/60" />
              <span>Personal Access Control</span>
            </div>
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-primary-foreground/60" />
              <span>Store-Specific Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Team PIN Login</h1>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Team Member Access
            </h2>
            <p className="text-muted-foreground">
              Enter your name and 4-digit PIN to access the system
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePinLogin} className="space-y-6">
            <div className="space-y-2">
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
                className="h-12 rounded-xl border-border"
              />
            </div>

            <div className="space-y-2">
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
                className="h-12 rounded-xl border-border text-center text-lg tracking-widest"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-dark rounded-xl font-medium"
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
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-primary hover:text-primary/80 hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Main Login
              </Button>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Access Information</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Contact your store manager for your PIN</p>
                <p>• Use your full name as registered in the system</p>
                <p>• Access level depends on your assigned role</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
