-- Migration: Public Showcase Cart and Order System
-- Description: Add cart functionality, product variants, and public orders to showcase
-- Date: 2025-07-23

-- Add product variants support
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL CHECK (variant_type IN ('color', 'size', 'style')),
  variant_name TEXT NOT NULL,
  variant_value TEXT NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0.00,
  stock_quantity INTEGER DEFAULT 0,
  sku_suffix TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_type, variant_value)
);

-- Create index for variant queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active 
ON public.product_variants(product_id, is_active) 
WHERE is_active = true;

-- Add WhatsApp settings to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- Create public orders table (separate from internal POS orders)
CREATE TABLE IF NOT EXISTS public.public_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled')),
  notes TEXT,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for order code lookups
CREATE INDEX IF NOT EXISTS idx_public_orders_code ON public.public_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_public_orders_store_status ON public.public_orders(store_id, status);

-- Create public order items table
CREATE TABLE IF NOT EXISTS public.public_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.public_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  selected_variants JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order notifications table
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.public_orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_order', 'order_update', 'whatsapp_sent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_order_notifications_store_unread 
ON public.order_notifications(store_id, is_read, created_at DESC);

-- Function to generate unique order codes
CREATE OR REPLACE FUNCTION generate_order_code(store_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  code_prefix TEXT;
  random_suffix TEXT;
  final_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Get store code for prefix
  SELECT COALESCE(store_code, 'ORD') INTO code_prefix
  FROM public.stores 
  WHERE id = store_id_param;
  
  -- Generate random code until unique
  LOOP
    -- Generate 6-character random alphanumeric suffix
    random_suffix := UPPER(
      SUBSTRING(
        encode(gen_random_bytes(4), 'base64')
        FROM 1 FOR 6
      )
    );
    
    -- Remove any non-alphanumeric characters
    random_suffix := REGEXP_REPLACE(random_suffix, '[^A-Z0-9]', '', 'g');
    
    -- Ensure we have 6 characters
    IF LENGTH(random_suffix) < 6 THEN
      random_suffix := random_suffix || SUBSTRING('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 1, 6 - LENGTH(random_suffix));
    END IF;
    
    final_code := code_prefix || '-' || random_suffix;
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 FROM public.public_orders WHERE order_code = final_code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create order notification
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for new orders
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_notifications (
      store_id,
      order_id,
      notification_type,
      title,
      message
    ) VALUES (
      NEW.store_id,
      NEW.id,
      'new_order',
      'New Order Received',
      'Order ' || NEW.order_code || ' has been placed by ' || NEW.customer_name
    );
  END IF;
  
  -- Create notification for status updates
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.order_notifications (
      store_id,
      order_id,
      notification_type,
      title,
      message
    ) VALUES (
      NEW.store_id,
      NEW.id,
      'order_update',
      'Order Status Updated',
      'Order ' || NEW.order_code || ' status changed to ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order notifications
DROP TRIGGER IF EXISTS trigger_order_notifications ON public.public_orders;
CREATE TRIGGER trigger_order_notifications
  AFTER INSERT OR UPDATE ON public.public_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_notification();

-- RLS Policies for public orders (read-only for public, full access for store owners)
ALTER TABLE public.public_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public orders: Store owners can manage their orders
CREATE POLICY "Store owners can manage their public orders" ON public.public_orders
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id = auth.uid()
    )
  );

-- Public order items: Store owners can manage their order items
CREATE POLICY "Store owners can manage their public order items" ON public.public_order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM public.public_orders 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Order notifications: Store owners can see their notifications
CREATE POLICY "Store owners can see their order notifications" ON public.order_notifications
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id = auth.uid()
    )
  );

-- Product variants: Store owners can manage their product variants
CREATE POLICY "Store owners can manage their product variants" ON public.product_variants
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Public can read product variants for public products
CREATE POLICY "Public can read variants for public products" ON public.product_variants
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE is_public = true AND is_active = true
    )
  );

-- RPC function to create a public order
CREATE OR REPLACE FUNCTION create_public_order(
  store_identifier TEXT,
  customer_data JSONB,
  order_items JSONB[]
)
RETURNS JSONB AS $$
DECLARE
  store_record RECORD;
  order_id UUID;
  order_code TEXT;
  item JSONB;
  product_record RECORD;
  variant_record RECORD;
  item_total DECIMAL(10,2);
  subtotal DECIMAL(10,2) := 0;
  tax_amount DECIMAL(10,2) := 0;
  total DECIMAL(10,2);
  result JSONB;
BEGIN
  -- Get store information
  SELECT s.* INTO store_record
  FROM public.stores s
  WHERE (s.id::text = store_identifier
         OR s.store_code = store_identifier
         OR s.showcase_slug = store_identifier)
    AND s.enable_public_showcase = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found or showcase not enabled';
  END IF;

  -- Generate order code
  order_code := generate_order_code(store_record.id);

  -- Create the order
  INSERT INTO public.public_orders (
    store_id,
    order_code,
    customer_name,
    customer_phone,
    subtotal,
    tax_amount,
    total,
    status
  ) VALUES (
    store_record.id,
    order_code,
    customer_data->>'name',
    customer_data->>'phone',
    0, -- Will be updated below
    0, -- Will be updated below
    0, -- Will be updated below
    'pending'
  ) RETURNING id INTO order_id;

  -- Process each order item
  FOREACH item IN ARRAY order_items LOOP
    -- Get product information
    SELECT p.* INTO product_record
    FROM public.products p
    WHERE p.id = (item->>'product_id')::UUID
      AND p.store_id = store_record.id
      AND p.is_public = true
      AND p.is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or not available: %', item->>'product_id';
    END IF;

    -- Calculate item total (base price + variant adjustments)
    item_total := product_record.price * (item->>'quantity')::INTEGER;

    -- Add variant price adjustments if any
    IF item ? 'variants' AND jsonb_typeof(item->'variants') = 'object' THEN
      FOR variant_record IN
        SELECT pv.price_adjustment
        FROM public.product_variants pv
        WHERE pv.product_id = product_record.id
          AND pv.is_active = true
          AND (
            (pv.variant_type = 'color' AND pv.variant_value = item->'variants'->>'color') OR
            (pv.variant_type = 'size' AND pv.variant_value = item->'variants'->>'size') OR
            (pv.variant_type = 'style' AND pv.variant_value = item->'variants'->>'style')
          )
      LOOP
        item_total := item_total + (variant_record.price_adjustment * (item->>'quantity')::INTEGER);
      END LOOP;
    END IF;

    -- Insert order item
    INSERT INTO public.public_order_items (
      order_id,
      product_id,
      product_name,
      product_image_url,
      quantity,
      unit_price,
      total_price,
      selected_variants
    ) VALUES (
      order_id,
      product_record.id,
      product_record.name,
      product_record.image_url,
      (item->>'quantity')::INTEGER,
      item_total / (item->>'quantity')::INTEGER,
      item_total,
      COALESCE(item->'variants', '{}'::jsonb)
    );

    subtotal := subtotal + item_total;
  END LOOP;

  -- Calculate tax
  tax_amount := subtotal * COALESCE(store_record.tax_rate, 0);
  total := subtotal + tax_amount;

  -- Update order totals
  UPDATE public.public_orders
  SET subtotal = subtotal,
      tax_amount = tax_amount,
      total = total,
      updated_at = now()
  WHERE id = order_id;

  -- Return order information
  SELECT jsonb_build_object(
    'order_id', order_id,
    'order_code', order_code,
    'subtotal', subtotal,
    'tax_amount', tax_amount,
    'total', total,
    'status', 'pending',
    'store_name', store_record.name,
    'store_phone', store_record.phone,
    'whatsapp_number', store_record.whatsapp_number
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get order by code
CREATE OR REPLACE FUNCTION get_public_order_by_code(order_code_param TEXT)
RETURNS JSONB AS $$
DECLARE
  order_record RECORD;
  items JSONB;
  result JSONB;
BEGIN
  -- Get order with store information
  SELECT
    po.*,
    s.name as store_name,
    s.phone as store_phone,
    s.whatsapp_number
  INTO order_record
  FROM public.public_orders po
  JOIN public.stores s ON po.store_id = s.id
  WHERE po.order_code = order_code_param;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get order items
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', poi.id,
      'product_id', poi.product_id,
      'product_name', poi.product_name,
      'product_image_url', poi.product_image_url,
      'quantity', poi.quantity,
      'unit_price', poi.unit_price,
      'total_price', poi.total_price,
      'selected_variants', poi.selected_variants
    )
  ) INTO items
  FROM public.public_order_items poi
  WHERE poi.order_id = order_record.id;

  -- Build result
  SELECT jsonb_build_object(
    'id', order_record.id,
    'order_code', order_record.order_code,
    'customer_name', order_record.customer_name,
    'customer_phone', order_record.customer_phone,
    'subtotal', order_record.subtotal,
    'tax_amount', order_record.tax_amount,
    'total', order_record.total,
    'status', order_record.status,
    'notes', order_record.notes,
    'created_at', order_record.created_at,
    'updated_at', order_record.updated_at,
    'store', jsonb_build_object(
      'name', order_record.store_name,
      'phone', order_record.store_phone,
      'whatsapp_number', order_record.whatsapp_number
    ),
    'items', COALESCE(items, '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for public order functions
GRANT EXECUTE ON FUNCTION public.create_public_order(TEXT, JSONB, JSONB[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_order_by_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_code(UUID) TO anon, authenticated;

-- Add policies to allow the RPC function to insert orders (SECURITY DEFINER functions bypass RLS)
CREATE POLICY "Allow public order creation via RPC" ON public.public_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public order items creation via RPC" ON public.public_order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow order notifications creation via RPC" ON public.order_notifications
  FOR INSERT WITH CHECK (true);
