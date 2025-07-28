-- CRITICAL SECURITY FIX
-- This migration fixes the major security vulnerability where PIN sessions
-- were allowing unrestricted access to all data

-- First, let's create a proper session validation table
CREATE TABLE IF NOT EXISTS public.pin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.store_members(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on pin_sessions
ALTER TABLE public.pin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for pin_sessions - only the session owner can access
CREATE POLICY "Pin sessions access" ON public.pin_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.store_members sm
    WHERE sm.id = pin_sessions.member_id
    AND sm.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pin_sessions_token ON public.pin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_pin_sessions_store_member ON public.pin_sessions(store_id, member_id);
CREATE INDEX IF NOT EXISTS idx_pin_sessions_expires ON public.pin_sessions(expires_at);

-- Create a function to validate PIN sessions properly
CREATE OR REPLACE FUNCTION public.is_pin_session_valid()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  session_token TEXT;
  session_valid BOOLEAN := false;
BEGIN
  -- Get session token from request headers or current_setting
  BEGIN
    session_token := current_setting('request.headers', true)::json->>'x-pin-session-token';
  EXCEPTION WHEN OTHERS THEN
    session_token := NULL;
  END;

  -- If no session token, check if it's set via current_setting
  IF session_token IS NULL THEN
    BEGIN
      session_token := current_setting('app.pin_session_token', true);
    EXCEPTION WHEN OTHERS THEN
      session_token := NULL;
    END;
  END IF;

  -- If still no token, return false
  IF session_token IS NULL OR session_token = '' THEN
    RETURN false;
  END IF;

  -- Check if session exists and is valid
  SELECT EXISTS(
    SELECT 1 FROM public.pin_sessions ps
    WHERE ps.session_token = session_token
    AND ps.expires_at > NOW()
    AND ps.is_active = true
  ) INTO session_valid;

  -- Update last activity if session is valid
  IF session_valid THEN
    UPDATE public.pin_sessions 
    SET last_activity = NOW()
    WHERE session_token = session_token;
  END IF;

  RETURN session_valid;
END;
$$;

-- Create function to create a PIN session
CREATE OR REPLACE FUNCTION public.create_pin_session(
  _store_id UUID,
  _member_id UUID,
  _pin TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  session_token TEXT,
  expires_at TIMESTAMPTZ,
  member_name TEXT,
  role store_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_record RECORD;
  new_session_token TEXT;
  session_expires TIMESTAMPTZ;
BEGIN
  -- Validate PIN and get member info
  SELECT sm.*, s.name as store_name
  INTO member_record
  FROM public.store_members sm
  JOIN public.stores s ON s.id = sm.store_id
  WHERE sm.id = _member_id 
    AND sm.store_id = _store_id
    AND sm.pin = _pin
    AND sm.is_active = true;

  -- If member not found or PIN invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::TEXT, NULL::store_role;
    RETURN;
  END IF;

  -- Generate session token and expiry (4 hours)
  new_session_token := encode(gen_random_bytes(32), 'base64');
  session_expires := NOW() + INTERVAL '4 hours';

  -- Insert new session
  INSERT INTO public.pin_sessions (
    store_id,
    member_id,
    session_token,
    expires_at
  ) VALUES (
    _store_id,
    _member_id,
    new_session_token,
    session_expires
  );

  -- Return success with session info
  RETURN QUERY SELECT 
    true,
    new_session_token,
    session_expires,
    member_record.name,
    member_record.role;
END;
$$;

-- Create function to invalidate PIN session
CREATE OR REPLACE FUNCTION public.invalidate_pin_session(_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pin_sessions 
  SET is_active = false
  WHERE session_token = _session_token;
  
  RETURN FOUND;
END;
$$;

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_pin_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.pin_sessions 
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create a more secure user_can_access_store function
CREATE OR REPLACE FUNCTION public.user_can_access_store(_store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user is store owner
  IF EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = _store_id AND owner_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is an active store member
  IF EXISTS (
    SELECT 1 FROM public.store_members 
    WHERE store_id = _store_id 
    AND user_id = auth.uid() 
    AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Update all the overly permissive policies to be more secure
-- Remove the dangerous "PIN session access" policies that allow everything

-- Transactions
DROP POLICY IF EXISTS "PIN session access" ON public.transactions;
CREATE POLICY "Secure transactions access" ON public.transactions
FOR ALL USING (
  user_can_access_store(store_id) OR 
  (is_pin_session_valid() AND EXISTS (
    SELECT 1 FROM public.pin_sessions ps
    JOIN public.store_members sm ON sm.id = ps.member_id
    WHERE ps.session_token = current_setting('app.pin_session_token', true)
    AND sm.store_id = transactions.store_id
    AND ps.is_active = true
    AND ps.expires_at > NOW()
  ))
);

-- Products  
DROP POLICY IF EXISTS "PIN session access" ON public.products;
CREATE POLICY "Secure products access" ON public.products
FOR ALL USING (
  user_can_access_store(store_id) OR 
  (is_pin_session_valid() AND EXISTS (
    SELECT 1 FROM public.pin_sessions ps
    JOIN public.store_members sm ON sm.id = ps.member_id
    WHERE ps.session_token = current_setting('app.pin_session_token', true)
    AND sm.store_id = products.store_id
    AND ps.is_active = true
    AND ps.expires_at > NOW()
  ))
);

-- Customers
DROP POLICY IF EXISTS "PIN session access" ON public.customers;
CREATE POLICY "Secure customers access" ON public.customers
FOR ALL USING (
  user_can_access_store(store_id) OR 
  (is_pin_session_valid() AND EXISTS (
    SELECT 1 FROM public.pin_sessions ps
    JOIN public.store_members sm ON sm.id = ps.member_id
    WHERE ps.session_token = current_setting('app.pin_session_token', true)
    AND sm.store_id = customers.store_id
    AND ps.is_active = true
    AND ps.expires_at > NOW()
  ))
);

-- Add similar secure policies for other critical tables
-- Orders
DROP POLICY IF EXISTS "PIN session access" ON public.orders;
CREATE POLICY "Secure orders access" ON public.orders
FOR ALL USING (
  user_can_access_store(store_id) OR 
  (is_pin_session_valid() AND EXISTS (
    SELECT 1 FROM public.pin_sessions ps
    JOIN public.store_members sm ON sm.id = ps.member_id
    WHERE ps.session_token = current_setting('app.pin_session_token', true)
    AND sm.store_id = orders.store_id
    AND ps.is_active = true
    AND ps.expires_at > NOW()
  ))
);

-- Create a function to set PIN session token for the current request
CREATE OR REPLACE FUNCTION public.set_pin_session_token(_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.pin_session_token', _token, true);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_pin_session_valid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_pin_session(UUID, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.invalidate_pin_session(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_pin_session_token(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_store(UUID) TO authenticated, anon;

-- Log this critical security fix
INSERT INTO public.activity_logs (
  store_id,
  user_id,
  action,
  details
) VALUES (
  NULL,
  NULL,
  'CRITICAL_SECURITY_FIX',
  '{"description": "Fixed PIN session validation vulnerability", "timestamp": "' || NOW() || '"}'::jsonb
);
