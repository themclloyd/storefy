import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface TeamMember {
  id: string;
  user_id?: string | null;
  role: 'owner' | 'manager' | 'cashier';
  is_active: boolean;
  created_at: string;
  name: string;
  phone?: string;
  email?: string;
  pin?: string;
}

export interface RoleStats {
  owner: number;
  manager: number;
  cashier: number;
  total: number;
}

interface TeamState {
  members: TeamMember[];
  roleStats: RoleStats;
  loading: boolean;
  error: string | null;
}

interface TeamActions {
  // Data actions
  setMembers: (members: TeamMember[]) => void;
  fetchMembers: (storeId: string) => Promise<void>;
  addMember: (storeId: string, memberData: Omit<TeamMember, 'id' | 'created_at'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  // Computed actions
  calculateRoleStats: () => void;
  
  // State actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type TeamStore = TeamState & TeamActions;

const initialState: TeamState = {
  members: [],
  roleStats: { owner: 0, manager: 0, cashier: 0, total: 0 },
  loading: false,
  error: null,
};

export const useTeamStore = create<TeamStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Data actions
      setMembers: (members) => {
        set({ members, error: null }, false, 'team/setMembers');
        get().calculateRoleStats();
      },

      fetchMembers: async (storeId: string) => {
        try {
          set({ loading: true, error: null }, false, 'team/fetchMembers:start');
          
          const { data, error } = await supabase
            .from('store_members')
            .select(`
              id,
              user_id,
              role,
              is_active,
              created_at,
              name,
              phone,
              email,
              pin
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({ 
            members: data || [], 
            loading: false,
            error: null 
          }, false, 'team/fetchMembers:success');
          
          get().calculateRoleStats();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load team members';
          console.error('Error fetching team members:', error);
          toast.error(errorMessage);
          set({ 
            loading: false, 
            error: errorMessage 
          }, false, 'team/fetchMembers:error');
        }
      },

      addMember: async (storeId: string, memberData) => {
        try {
          set({ loading: true, error: null }, false, 'team/addMember:start');

          // Check if PIN is already in use
          const { data: existingPin } = await supabase
            .from('store_members')
            .select('id')
            .eq('store_id', storeId)
            .eq('pin', memberData.pin)
            .maybeSingle();

          if (existingPin) {
            throw new Error('This PIN is already in use. Please choose a different PIN.');
          }

          const { error } = await supabase
            .from('store_members')
            .insert({
              store_id: storeId,
              user_id: null,
              role: memberData.role,
              name: memberData.name,
              phone: memberData.phone || null,
              email: memberData.email || null,
              pin: memberData.pin || null,
              is_active: memberData.is_active,
            });

          if (error) throw error;

          toast.success('Team member added successfully');
          
          // Refresh members
          await get().fetchMembers(storeId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add team member';
          console.error('Error adding team member:', error);
          toast.error(errorMessage);
          set({ 
            loading: false, 
            error: errorMessage 
          }, false, 'team/addMember:error');
        }
      },

      updateMember: async (id: string, updates) => {
        try {
          set({ loading: true, error: null }, false, 'team/updateMember:start');

          const { error } = await supabase
            .from('store_members')
            .update(updates)
            .eq('id', id);

          if (error) throw error;

          // Update local state
          const { members } = get();
          const updatedMembers = members.map(member =>
            member.id === id ? { ...member, ...updates } : member
          );
          
          set({ 
            members: updatedMembers, 
            loading: false,
            error: null 
          }, false, 'team/updateMember:success');
          
          get().calculateRoleStats();
          toast.success('Team member updated successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update team member';
          console.error('Error updating team member:', error);
          toast.error(errorMessage);
          set({ 
            loading: false, 
            error: errorMessage 
          }, false, 'team/updateMember:error');
        }
      },

      deleteMember: async (id: string) => {
        try {
          set({ loading: true, error: null }, false, 'team/deleteMember:start');

          const { error } = await supabase
            .from('store_members')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Update local state
          const { members } = get();
          const updatedMembers = members.filter(member => member.id !== id);
          
          set({ 
            members: updatedMembers, 
            loading: false,
            error: null 
          }, false, 'team/deleteMember:success');
          
          get().calculateRoleStats();
          toast.success('Team member deleted successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete team member';
          console.error('Error deleting team member:', error);
          toast.error(errorMessage);
          set({ 
            loading: false, 
            error: errorMessage 
          }, false, 'team/deleteMember:error');
        }
      },

      // Computed actions
      calculateRoleStats: () => {
        const { members } = get();
        const stats = members.reduce(
          (acc, member) => {
            if (member.is_active) {
              acc[member.role]++;
              acc.total++;
            }
            return acc;
          },
          { owner: 0, manager: 0, cashier: 0, total: 0 }
        );
        
        set({ roleStats: stats }, false, 'team/calculateRoleStats');
      },

      // State actions
      setLoading: (loading) => set({ loading }, false, 'team/setLoading'),
      setError: (error) => set({ error }, false, 'team/setError'),
      reset: () => set(initialState, false, 'team/reset'),
    }),
    { name: 'team-store' }
  )
);

// Selectors
export const useTeamMembers = () => useTeamStore(state => state.members);
export const useTeamRoleStats = () => useTeamStore(state => state.roleStats);
export const useTeamLoading = () => useTeamStore(state => state.loading);
export const useTeamError = () => useTeamStore(state => state.error);

// Actions
export const useTeamActions = () => useTeamStore(state => ({
  setMembers: state.setMembers,
  fetchMembers: state.fetchMembers,
  addMember: state.addMember,
  updateMember: state.updateMember,
  deleteMember: state.deleteMember,
  calculateRoleStats: state.calculateRoleStats,
  setLoading: state.setLoading,
  setError: state.setError,
  reset: state.reset,
}));
