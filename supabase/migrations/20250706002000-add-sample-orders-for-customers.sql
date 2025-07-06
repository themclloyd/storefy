-- Migration: Add sample orders linked to customers for testing customer order history and analytics
-- This migration creates realistic order data to demonstrate the customer management features

DO $$
DECLARE
  _store_id UUID;
  _sarah_id UUID;
  _michael_id UUID;
  _emily_id UUID;
  _robert_id UUID;
  _cashier_id UUID;
BEGIN
  -- Get the store ID (assuming there's only one store for now)
  SELECT id INTO _store_id FROM public.stores LIMIT 1;
  
  -- Get customer IDs
  SELECT id INTO _sarah_id FROM public.customers WHERE name = 'Sarah Johnson' LIMIT 1;
  SELECT id INTO _michael_id FROM public.customers WHERE name = 'Michael Chen' LIMIT 1;
  SELECT id INTO _emily_id FROM public.customers WHERE name = 'Emily Davis' LIMIT 1;
  SELECT id INTO _robert_id FROM public.customers WHERE name = 'Robert Wilson' LIMIT 1;
  
  -- Get a cashier ID (store owner)
  SELECT owner_id INTO _cashier_id FROM public.stores WHERE id = _store_id;

  -- Only proceed if we have the necessary data
  IF _store_id IS NOT NULL AND _sarah_id IS NOT NULL AND _cashier_id IS NOT NULL THEN
    
    -- Insert sample orders for Sarah Johnson (15 orders, $425.67 total)
    INSERT INTO public.orders (store_id, customer_id, cashier_id, order_number, subtotal, tax_amount, total, status, payment_method, created_at) VALUES
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-001', 25.00, 2.06, 27.06, 'completed', 'card', '2024-01-15 10:30:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-015', 32.50, 2.68, 35.18, 'completed', 'cash', '2024-02-03 14:20:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-028', 18.75, 1.55, 20.30, 'completed', 'card', '2024-02-18 16:45:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-045', 45.00, 3.71, 48.71, 'completed', 'card', '2024-03-05 11:15:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-067', 28.90, 2.38, 31.28, 'completed', 'cash', '2024-03-22 13:30:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-089', 22.40, 1.85, 24.25, 'completed', 'card', '2024-04-08 15:20:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-112', 38.60, 3.18, 41.78, 'completed', 'card', '2024-04-25 12:10:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-134', 15.80, 1.30, 17.10, 'completed', 'cash', '2024-05-12 14:45:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-156', 42.30, 3.49, 45.79, 'completed', 'card', '2024-05-28 16:30:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-178', 29.70, 2.45, 32.15, 'completed', 'card', '2024-06-14 10:20:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-201', 33.20, 2.74, 35.94, 'completed', 'cash', '2024-06-30 13:15:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-223', 19.50, 1.61, 21.11, 'completed', 'card', '2024-07-02 15:40:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-234', 26.80, 2.21, 29.01, 'completed', 'card', '2024-07-03 11:25:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-245', 31.40, 2.59, 33.99, 'completed', 'cash', '2024-07-04 14:10:00+00'),
      (_store_id, _sarah_id, _cashier_id, 'ORD-2024-256', 24.60, 2.03, 26.63, 'completed', 'card', '2024-07-05 16:55:00+00');

    -- Insert sample orders for Michael Chen (8 orders, $189.34 total)
    INSERT INTO public.orders (store_id, customer_id, cashier_id, order_number, subtotal, tax_amount, total, status, payment_method, created_at) VALUES
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-012', 22.50, 1.86, 24.36, 'completed', 'card', '2024-01-28 12:15:00+00'),
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-034', 18.90, 1.56, 20.46, 'completed', 'cash', '2024-02-25 14:30:00+00'),
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-058', 27.40, 2.26, 29.66, 'completed', 'card', '2024-03-18 16:20:00+00'),
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-081', 15.60, 1.29, 16.89, 'completed', 'cash', '2024-04-15 11:45:00+00'),
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-105', 31.20, 2.57, 33.77, 'completed', 'card', '2024-05-08 13:25:00+00'),
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-128', 19.80, 1.63, 21.43, 'completed', 'card', '2024-05-30 15:10:00+00'),
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-167', 24.70, 2.04, 26.74, 'completed', 'cash', '2024-06-22 12:40:00+00'),
      (_store_id, _michael_id, _cashier_id, 'ORD-2024-189', 14.20, 1.17, 15.37, 'completed', 'card', '2024-07-01 14:55:00+00');

    -- Insert sample orders for Emily Davis (23 orders, $1247.89 total) - VIP customer
    INSERT INTO public.orders (store_id, customer_id, cashier_id, order_number, subtotal, tax_amount, total, status, payment_method, created_at) VALUES
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-003', 85.40, 7.05, 92.45, 'completed', 'card', '2024-01-08 10:15:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-018', 62.30, 5.14, 67.44, 'completed', 'card', '2024-01-22 13:30:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-031', 78.90, 6.51, 85.41, 'completed', 'card', '2024-02-12 15:20:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-047', 45.60, 3.76, 49.36, 'completed', 'cash', '2024-02-28 11:45:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-063', 92.80, 7.66, 100.46, 'completed', 'card', '2024-03-15 14:10:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-076', 38.70, 3.19, 41.89, 'completed', 'card', '2024-03-30 16:25:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-094', 67.20, 5.54, 72.74, 'completed', 'card', '2024-04-18 12:35:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-108', 54.90, 4.53, 59.43, 'completed', 'cash', '2024-05-02 14:50:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-125', 73.40, 6.06, 79.46, 'completed', 'card', '2024-05-20 10:30:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-142', 41.80, 3.45, 45.25, 'completed', 'card', '2024-06-05 13:15:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-159', 88.60, 7.31, 95.91, 'completed', 'card', '2024-06-18 15:40:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-174', 29.50, 2.43, 31.93, 'completed', 'cash', '2024-06-25 11:20:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-192', 76.30, 6.30, 82.60, 'completed', 'card', '2024-07-01 16:10:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-205', 52.70, 4.35, 57.05, 'completed', 'card', '2024-07-02 12:45:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-218', 64.80, 5.35, 70.15, 'completed', 'card', '2024-07-03 14:25:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-229', 35.90, 2.96, 38.86, 'completed', 'cash', '2024-07-04 10:55:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-241', 81.20, 6.70, 87.90, 'completed', 'card', '2024-07-04 15:30:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-252', 47.60, 3.93, 51.53, 'completed', 'card', '2024-07-05 11:40:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-263', 58.90, 4.86, 63.76, 'completed', 'card', '2024-07-05 13:20:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-274', 42.30, 3.49, 45.79, 'completed', 'cash', '2024-07-05 16:15:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-285', 69.70, 5.75, 75.45, 'completed', 'card', '2024-07-06 10:25:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-296', 33.40, 2.76, 36.16, 'completed', 'card', '2024-07-06 12:50:00+00'),
      (_store_id, _emily_id, _cashier_id, 'ORD-2024-307', 55.80, 4.60, 60.40, 'completed', 'card', '2024-07-06 15:35:00+00');

    -- Insert sample orders for Robert Wilson (3 orders, $67.45 total) - Inactive customer
    INSERT INTO public.orders (store_id, customer_id, cashier_id, order_number, subtotal, tax_amount, total, status, payment_method, created_at) VALUES
      (_store_id, _robert_id, _cashier_id, 'ORD-2024-007', 18.50, 1.53, 20.03, 'completed', 'cash', '2024-01-12 14:20:00+00'),
      (_store_id, _robert_id, _cashier_id, 'ORD-2024-023', 24.80, 2.05, 26.85, 'completed', 'card', '2024-02-08 16:40:00+00'),
      (_store_id, _robert_id, _cashier_id, 'ORD-2024-039', 19.20, 1.58, 20.78, 'cancelled', 'card', '2024-02-20 12:15:00+00');

    RAISE NOTICE 'Sample orders created successfully for customer order history and analytics testing';
  ELSE
    RAISE NOTICE 'Required data not found. Skipping sample order creation.';
  END IF;
END;
$$;
