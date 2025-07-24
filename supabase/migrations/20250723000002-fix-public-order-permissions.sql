-- Fix permissions for public order creation
-- This migration adds the missing GRANT statements for the create_public_order RPC function

-- Grant execute permissions for public order functions
GRANT EXECUTE ON FUNCTION public.create_public_order(TEXT, JSONB, JSONB[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order_by_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_code(UUID) TO anon, authenticated;

-- Also ensure the public can insert into public_orders and public_order_items through the RPC function
-- The RPC function uses SECURITY DEFINER so it runs with elevated privileges

-- Add a policy to allow the RPC function to insert orders
CREATE POLICY "Allow RPC function to create public orders" ON public.public_orders
  FOR INSERT WITH CHECK (true);

-- Add a policy to allow the RPC function to insert order items  
CREATE POLICY "Allow RPC function to create public order items" ON public.public_order_items
  FOR INSERT WITH CHECK (true);

-- Add a policy to allow the RPC function to insert order notifications
CREATE POLICY "Allow RPC function to create order notifications" ON public.order_notifications
  FOR INSERT WITH CHECK (true);
