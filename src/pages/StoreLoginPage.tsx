import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Store, User, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

export default function StoreLoginPage() {
  const [memberName, setMemberName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { storeCode } = useParams();

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !pin.trim()) return;

    setLoading(true);
    try {
      // First, find the store by code
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('store_code', storeCode?.toUpperCase())
        .single();

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

      toast.success(`Welcome to ${memberData.stores.name}, ${displayName}!`);
      navigate('/pos'); // Direct to POS system
    } catch (error: any) {
      toast.error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-md card-professional shadow-strong">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Store Access
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Enter your name and PIN to access {storeCode?.toUpperCase()}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberName">Your Name</Label>
              <Input
                id="memberName"
                type="text"
                placeholder="Enter your full name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin">4-Digit PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary text-white"
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

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Need Help?</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Contact your store manager for your PIN</p>
                <p>• Use your full name as registered</p>
                <p>• Store code: <strong>{storeCode?.toUpperCase()}</strong></p>
              </div>
            </div>
            
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-primary hover:text-primary/80 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Store Manager Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}