-- Fix RLS policy recursion issues

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Store owners can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Store members can view their stores" ON public.stores;
DROP POLICY IF EXISTS "Store owners can manage members" ON public.store_members;
DROP POLICY IF EXISTS "Members can view own membership" ON public.store_members;

-- Create simpler, non-recursive policies for stores
CREATE POLICY "Users can manage their own stores" ON public.stores 
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Store members can view stores" ON public.stores 
  FOR SELECT USING (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT user_id FROM public.store_members 
      WHERE store_id = stores.id AND is_active = true
    )
  );

-- Create policies for store_members
CREATE POLICY "Store owners can manage all members" ON public.store_members 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = store_members.store_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own memberships" ON public.store_members 
  FOR SELECT USING (auth.uid() = user_id);

-- Update the has_store_access function to be simpler
CREATE OR REPLACE FUNCTION public.has_store_access(_store_id UUID, _min_role store_role DEFAULT 'cashier')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    -- Check if user is the store owner
    EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = auth.uid())
    OR
    -- Check if user has appropriate role as member
    EXISTS (
      SELECT 1 FROM public.store_members 
      WHERE store_id = _store_id 
      AND user_id = auth.uid() 
      AND is_active = true
      AND (
        role = 'manager' AND _min_role IN ('cashier', 'manager') OR
        role = 'cashier' AND _min_role = 'cashier'
      )
    );
$$;