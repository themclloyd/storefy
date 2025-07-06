-- Completely fix RLS recursion by using security definer functions

-- Drop ALL existing policies that could cause recursion
DROP POLICY IF EXISTS "Users can manage their own stores" ON public.stores;
DROP POLICY IF EXISTS "Store members can view stores" ON public.stores;
DROP POLICY IF EXISTS "Store owners can manage all members" ON public.store_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.store_members;

-- Also drop policies on other tables that use has_store_access
DROP POLICY IF EXISTS "Store access for categories" ON public.categories;
DROP POLICY IF EXISTS "Store access for products" ON public.products;
DROP POLICY IF EXISTS "Store access for customers" ON public.customers;
DROP POLICY IF EXISTS "Store access for orders" ON public.orders;
DROP POLICY IF EXISTS "Store access for order_items" ON public.order_items;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.user_can_access_store(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Direct query without policy interference
  SELECT EXISTS (
    SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.store_members 
    WHERE store_id = _store_id AND user_id = auth.uid() AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_store(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = auth.uid()
  );
$$;

-- Create simple, non-recursive policies using security definer functions

-- Stores policies - no cross-table references
CREATE POLICY "Store owners can manage stores" ON public.stores
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Store members can view stores" ON public.stores
  FOR SELECT USING (public.user_can_access_store(id));

-- Store members policies - using security definer function
CREATE POLICY "Store owners manage members" ON public.store_members
  FOR ALL USING (public.user_owns_store(store_id));

CREATE POLICY "Users view own memberships" ON public.store_members
  FOR SELECT USING (auth.uid() = user_id);

-- Recreate other table policies with security definer functions
CREATE POLICY "Store access for categories" ON public.categories
  FOR ALL USING (public.user_can_access_store(store_id));

CREATE POLICY "Store access for products" ON public.products
  FOR ALL USING (public.user_can_access_store(store_id));

CREATE POLICY "Store access for customers" ON public.customers
  FOR ALL USING (public.user_can_access_store(store_id));

CREATE POLICY "Store access for orders" ON public.orders
  FOR ALL USING (public.user_can_access_store(store_id));

CREATE POLICY "Store access for order_items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id AND public.user_can_access_store(o.store_id)
    )
  );