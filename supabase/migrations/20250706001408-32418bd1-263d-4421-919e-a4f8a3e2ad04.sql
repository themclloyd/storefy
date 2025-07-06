-- Insert sample data for testing
-- This will only work after users create their stores

-- Insert sample categories for the first store (this is just example data structure)
-- The actual inserts will happen when users create stores

-- Create a function to initialize sample data for a new store
CREATE OR REPLACE FUNCTION public.initialize_sample_data(_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert sample categories
  INSERT INTO public.categories (store_id, name, description) VALUES
    (_store_id, 'Beverages', 'Coffee, tea, and other drinks'),
    (_store_id, 'Food', 'Snacks and food items'),
    (_store_id, 'Accessories', 'Store accessories and merchandise')
  ON CONFLICT DO NOTHING;

  -- Insert sample products
  INSERT INTO public.products (store_id, name, sku, price, cost, stock_quantity, low_stock_threshold, category_id) 
  SELECT 
    _store_id,
    p.name,
    p.sku,
    p.price,
    p.cost,
    p.stock_quantity,
    p.low_stock_threshold,
    c.id
  FROM (VALUES
    ('Premium Coffee Beans', 'COFFEE-001', 24.99, 12.50, 45, 10, 'Beverages'),
    ('Organic Tea Set', 'TEA-002', 15.99, 8.00, 8, 15, 'Beverages'),
    ('Ceramic Mug', 'MUG-003', 8.99, 4.25, 23, 5, 'Accessories'),
    ('Artisan Cookies', 'COOKIE-004', 12.99, 6.50, 2, 10, 'Food')
  ) AS p(name, sku, price, cost, stock_quantity, low_stock_threshold, category_name)
  LEFT JOIN public.categories c ON c.name = p.category_name AND c.store_id = _store_id
  ON CONFLICT DO NOTHING;

  -- Insert sample customers
  INSERT INTO public.customers (store_id, name, email, phone, total_orders, total_spent, status) VALUES
    (_store_id, 'Sarah Johnson', 'sarah@email.com', '+1 (555) 123-4567', 15, 425.67, 'active'),
    (_store_id, 'Michael Chen', 'michael@email.com', '+1 (555) 234-5678', 8, 189.34, 'active'),
    (_store_id, 'Emily Davis', 'emily@email.com', '+1 (555) 345-6789', 23, 1247.89, 'vip'),
    (_store_id, 'Robert Wilson', 'robert@email.com', '+1 (555) 456-7890', 3, 67.45, 'inactive')
  ON CONFLICT DO NOTHING;
END;
$$;