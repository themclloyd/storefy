-- Enhanced Role-Based Access Control (RBAC) Security
-- This migration enhances the existing RBAC system with proper security measures

-- Create a function to validate PIN sessions securely
CREATE OR REPLACE FUNCTION public.validate_pin_session(_store_id UUID, _member_id UUID, _pin TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  role store_role,
  member_name TEXT,
  store_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN sm.is_active = true AND sm.pin = _pin AND sm.store_id = _store_id THEN true
      ELSE false
    END as is_valid,
    sm.role,
    sm.name as member_name,
    s.name as store_name
  FROM public.store_members sm
  JOIN public.stores s ON s.id = sm.store_id
  WHERE sm.id = _member_id 
    AND sm.store_id = _store_id
    AND sm.is_active = true;
$$;

-- Create a comprehensive role permission checking function
CREATE OR REPLACE FUNCTION public.check_user_permission(
  _store_id UUID,
  _action TEXT,
  _resource TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role store_role;
  is_owner BOOLEAN := false;
BEGIN
  -- Check if user is store owner
  SELECT EXISTS(
    SELECT 1 FROM public.stores 
    WHERE id = _store_id AND owner_id = auth.uid()
  ) INTO is_owner;
  
  -- If owner, allow all actions
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Get user role from store_members
  SELECT role INTO user_role
  FROM public.store_members
  WHERE store_id = _store_id 
    AND user_id = auth.uid() 
    AND is_active = true;
  
  -- If no role found, deny access
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Define role-based permissions
  CASE user_role
    WHEN 'manager' THEN
      -- Managers can do most things except critical settings
      RETURN _action NOT IN ('delete_store', 'change_ownership', 'manage_billing', 'export_all_data');
      
    WHEN 'cashier' THEN
      -- Cashiers have limited permissions
      RETURN _action IN (
        'view_dashboard', 'process_transaction', 'view_products', 'view_customers',
        'create_customer', 'update_customer_basic', 'view_layby', 'process_layby_payment',
        'view_inventory_basic', 'view_reports_basic'
      );
      
    ELSE
      -- Unknown role, deny access
      RETURN false;
  END CASE;
END;
$$;

-- Create function to get user's effective role (considering PIN sessions)
CREATE OR REPLACE FUNCTION public.get_user_effective_role(_store_id UUID)
RETURNS TABLE(
  role store_role,
  is_owner BOOLEAN,
  member_id UUID,
  member_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- First check if user is store owner
  SELECT 
    'owner'::store_role as role,
    true as is_owner,
    NULL::UUID as member_id,
    p.display_name as member_name
  FROM public.stores s
  LEFT JOIN public.profiles p ON p.user_id = s.owner_id
  WHERE s.id = _store_id AND s.owner_id = auth.uid()
  
  UNION ALL
  
  -- Then check store member role
  SELECT 
    sm.role,
    false as is_owner,
    sm.id as member_id,
    COALESCE(sm.name, p.display_name) as member_name
  FROM public.store_members sm
  LEFT JOIN public.profiles p ON p.user_id = sm.user_id
  WHERE sm.store_id = _store_id 
    AND sm.user_id = auth.uid() 
    AND sm.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = _store_id AND s.owner_id = auth.uid()
    )
  
  LIMIT 1;
$$;

-- Create audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _store_id UUID,
  _event_type TEXT,
  _details JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    store_id,
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    _store_id,
    auth.uid(),
    'security_event',
    jsonb_build_object(
      'event_type', _event_type,
      'details', _details,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    now()
  );
END;
$$;

-- Enhanced RLS policies for better security

-- Update store_members policies to be more restrictive
DROP POLICY IF EXISTS "Members can view own membership" ON public.store_members;
CREATE POLICY "Members can view store memberships" ON public.store_members
  FOR SELECT USING (
    -- Store owners can see all members
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid())
    OR
    -- Members can only see their own membership
    (user_id = auth.uid() AND is_active = true)
  );

-- Create policy for managers to view team members
CREATE POLICY "Managers can view team members" ON public.store_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'manager'
        AND sm.is_active = true
    )
  );

-- Create function to check page access permissions
CREATE OR REPLACE FUNCTION public.can_access_page(_store_id UUID, _page TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role store_role;
  is_owner BOOLEAN := false;
BEGIN
  -- Check if user is store owner
  SELECT EXISTS(
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = auth.uid()
  ) INTO is_owner;

  -- Owners can access all pages
  IF is_owner THEN
    RETURN true;
  END IF;

  -- Get user role
  SELECT role INTO user_role
  FROM public.store_members
  WHERE store_id = _store_id
    AND user_id = auth.uid()
    AND is_active = true;

  -- If no role, deny access
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Page access by role
  CASE _page
    WHEN 'dashboard' THEN RETURN true; -- All roles can access dashboard
    WHEN 'pos' THEN RETURN true; -- All roles can access POS
    WHEN 'inventory' THEN RETURN user_role IN ('manager', 'cashier');
    WHEN 'products' THEN RETURN user_role IN ('manager', 'cashier');
    WHEN 'categories' THEN RETURN user_role = 'manager';
    WHEN 'suppliers' THEN RETURN user_role = 'manager';
    WHEN 'customers' THEN RETURN true; -- All roles
    WHEN 'transactions' THEN RETURN true; -- All roles can view
    WHEN 'layby' THEN RETURN true; -- All roles
    WHEN 'reports' THEN RETURN user_role = 'manager';
    WHEN 'expenses' THEN RETURN user_role = 'manager';
    WHEN 'settings' THEN RETURN false; -- Only owners (handled above)
    ELSE RETURN false; -- Unknown page, deny access
  END CASE;
END;
$$;
