import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus,
  Crown,
  UserCheck,
  User,
  Mail,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InlineLoading } from '@/components/ui/modern-loading';

interface SystemUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  role?: string;
  display_name?: string;
  stores_count?: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching system users...');

      // Since we don't have admin privileges, use profiles table directly
      console.log('Fetching users from profiles table...');

      const { data: profileUsers, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        toast.error('Failed to fetch users');
        return;
      }

      console.log('Profiles fetched:', profileUsers?.length || 0);

      // Get additional data for each profile
      const usersWithDetails = await Promise.all(
        (profileUsers || []).map(async (profile) => {
          // Get stores count for this user
          const { count: storesCount } = await supabase
            .from('stores')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', profile.user_id);

          return {
            id: profile.user_id,
            email: profile.display_name || 'No name',
            created_at: profile.created_at,
            last_sign_in_at: profile.updated_at, // Use updated_at as proxy for activity
            email_confirmed_at: profile.created_at, // Assume verified if profile exists
            display_name: profile.display_name,
            stores_count: storesCount || 0,
            role: storesCount && storesCount > 0 ? 'store_owner' : 'user'
          };
        })
      );

      console.log('👥 Users fetched:', usersWithDetails.length);
      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    toast.success('Users refreshed');
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      return;
    }

    try {
      // Since we don't have admin privileges, we can only delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user profile:', error);
        toast.error('Failed to delete user profile');
        return;
      }

      toast.success('User profile deleted successfully');
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (user: SystemUser) => {
    if (user.stores_count && user.stores_count > 0) {
      return <Badge variant="default" className="gap-1"><Crown className="w-3 h-3" />Owner</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><User className="w-3 h-3" />User</Badge>;
  };

  const getStatusBadge = (user: SystemUser) => {
    if (user.email_confirmed_at) {
      return <Badge variant="default" className="gap-1"><UserCheck className="w-3 h-3" />Verified</Badge>;
    }
    return <Badge variant="destructive" className="gap-1"><Mail className="w-3 h-3" />Unverified</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <InlineLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.stores_count && u.stores_count > 0).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Store Owners</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.email_confirmed_at).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {users.filter(u => u.last_sign_in_at).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium text-sm">
              <div className="col-span-3">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Stores</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1">Actions</div>
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
                  <div className="col-span-3">
                    <div>
                      <p className="font-medium">{user.display_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    {getRoleBadge(user)}
                  </div>
                  <div className="col-span-2">
                    {getStatusBadge(user)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm">{user.stores_count || 0} stores</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
