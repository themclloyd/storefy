-- Test SQL to run in Supabase SQL Editor to fix the order creation issue

-- First, grant the necessary permissions
GRANT EXECUTE ON FUNCTION public.create_public_order(TEXT, JSONB, JSONB[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order_by_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_code(UUID) TO anon, authenticated;

-- Add policies to allow order creation
DROP POLICY IF EXISTS "Allow public order creation via RPC" ON public.public_orders;
CREATE POLICY "Allow public order creation via RPC" ON public.public_orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public order items creation via RPC" ON public.public_order_items;
CREATE POLICY "Allow public order items creation via RPC" ON public.public_order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow order notifications creation via RPC" ON public.order_notifications;
CREATE POLICY "Allow order notifications creation via RPC" ON public.order_notifications
  FOR INSERT WITH CHECK (true);

-- Test the function with sample data
SELECT public.create_public_order(
  'maca'::TEXT,
  '{"name": "Test Customer", "phone": "1234567890"}'::JSONB,
  ARRAY['{"product_id": "some-uuid", "quantity": 1, "variants": {}}'::JSONB]
);
