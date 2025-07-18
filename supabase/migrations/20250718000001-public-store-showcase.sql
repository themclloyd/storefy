-- Migration: Public Store Showcase Feature
-- Description: Add public showcase functionality to allow stores to display their inventory publicly
-- Date: 2025-07-18

-- Add public showcase settings to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS enable_public_showcase BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS showcase_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS showcase_theme JSONB DEFAULT '{"primaryColor": "#3b82f6", "secondaryColor": "#1e40af", "layout": "grid"}',
ADD COLUMN IF NOT EXISTS showcase_description TEXT,
ADD COLUMN IF NOT EXISTS showcase_logo_url TEXT,
ADD COLUMN IF NOT EXISTS showcase_banner_url TEXT,
ADD COLUMN IF NOT EXISTS showcase_contact_info JSONB DEFAULT '{"showPhone": true, "showEmail": true, "showAddress": true}',
ADD COLUMN IF NOT EXISTS showcase_seo_title TEXT,
ADD COLUMN IF NOT EXISTS showcase_seo_description TEXT;

-- Add public visibility flag to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_description TEXT,
ADD COLUMN IF NOT EXISTS show_stock_publicly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_price_publicly BOOLEAN DEFAULT true;

-- Create index for public product queries
CREATE INDEX IF NOT EXISTS idx_products_public_store 
ON public.products(store_id, is_public, is_active) 
WHERE is_public = true AND is_active = true;

-- Create index for store showcase queries
CREATE INDEX IF NOT EXISTS idx_stores_public_showcase
ON public.stores(id, enable_public_showcase)
WHERE enable_public_showcase = true;

-- Create index for showcase slug lookups
CREATE INDEX IF NOT EXISTS idx_stores_showcase_slug
ON public.stores(showcase_slug)
WHERE showcase_slug IS NOT NULL;

-- Create a view for public products (read-only access)
CREATE OR REPLACE VIEW public.public_products AS
SELECT 
  p.id,
  p.store_id,
  p.name,
  p.description,
  p.public_description,
  p.price,
  p.stock_quantity,
  p.image_url,
  p.created_at,
  p.show_stock_publicly,
  p.show_price_publicly,
  c.name as category_name,
  c.id as category_id
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE p.is_public = true 
  AND p.is_active = true;

-- Create a view for public stores (read-only access)
CREATE OR REPLACE VIEW public.public_stores AS
SELECT
  s.id,
  s.name,
  s.address,
  s.phone,
  s.email,
  s.store_code,
  s.currency,
  s.showcase_slug,
  s.showcase_theme,
  s.showcase_description,
  s.showcase_logo_url,
  s.showcase_banner_url,
  s.showcase_contact_info,
  s.showcase_seo_title,
  s.showcase_seo_description,
  s.created_at
FROM public.stores s
WHERE s.enable_public_showcase = true;

-- Row Level Security (RLS) Policies

-- Enable RLS on the views
ALTER TABLE public.public_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_stores ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public products
CREATE POLICY "Public products are viewable by everyone" ON public.public_products
  FOR SELECT USING (true);

-- Policy: Anyone can read public stores
CREATE POLICY "Public stores are viewable by everyone" ON public.public_stores
  FOR SELECT USING (true);

-- Update existing RLS policies for products table to allow public showcase access
-- Policy: Store members can manage products (existing)
-- Policy: Public products are readable by everyone (new)
CREATE POLICY "Public products readable by everyone" ON public.products
  FOR SELECT USING (is_public = true AND is_active = true);

-- Update existing RLS policies for stores table to allow public showcase access
-- Policy: Store owners/members can manage stores (existing)
-- Policy: Public stores are readable by everyone (new)
CREATE POLICY "Public stores readable by everyone" ON public.stores
  FOR SELECT USING (enable_public_showcase = true);

-- Function to get public store with product count
CREATE OR REPLACE FUNCTION public.get_public_store_info(store_identifier TEXT)
RETURNS TABLE (
  store_id UUID,
  store_name TEXT,
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  store_code TEXT,
  store_currency TEXT,
  showcase_slug TEXT,
  showcase_theme JSONB,
  showcase_description TEXT,
  showcase_logo_url TEXT,
  showcase_banner_url TEXT,
  showcase_contact_info JSONB,
  showcase_seo_title TEXT,
  showcase_seo_description TEXT,
  product_count BIGINT,
  category_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.address,
    s.phone,
    s.email,
    s.store_code,
    s.currency,
    s.showcase_slug,
    s.showcase_theme,
    s.showcase_description,
    s.showcase_logo_url,
    s.showcase_banner_url,
    s.showcase_contact_info,
    s.showcase_seo_title,
    s.showcase_seo_description,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT p.category_id) as category_count
  FROM public.stores s
  LEFT JOIN public.products p ON s.id = p.store_id AND p.is_public = true AND p.is_active = true
  WHERE s.enable_public_showcase = true
    AND (s.id::TEXT = store_identifier OR s.store_code = UPPER(store_identifier) OR s.showcase_slug = LOWER(store_identifier))
  GROUP BY s.id, s.name, s.address, s.phone, s.email, s.store_code, s.currency, s.showcase_slug,
           s.showcase_theme, s.showcase_description, s.showcase_logo_url,
           s.showcase_banner_url, s.showcase_contact_info, s.showcase_seo_title,
           s.showcase_seo_description;
END;
$$;

-- Function to get public products for a store
CREATE OR REPLACE FUNCTION public.get_public_products(store_identifier TEXT, category_filter TEXT DEFAULT NULL, search_query TEXT DEFAULT NULL)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_description TEXT,
  public_description TEXT,
  price DECIMAL(10,2),
  stock_quantity INTEGER,
  image_url TEXT,
  category_name TEXT,
  category_id UUID,
  show_stock_publicly BOOLEAN,
  show_price_publicly BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.public_description,
    p.price,
    p.stock_quantity,
    p.image_url,
    c.name as category_name,
    c.id as category_id,
    p.show_stock_publicly,
    p.show_price_publicly,
    p.created_at
  FROM public.products p
  LEFT JOIN public.categories c ON p.category_id = c.id
  INNER JOIN public.stores s ON p.store_id = s.id
  WHERE s.enable_public_showcase = true
    AND p.is_public = true
    AND p.is_active = true
    AND (s.id::TEXT = store_identifier OR s.store_code = UPPER(store_identifier) OR s.showcase_slug = LOWER(store_identifier))
    AND (category_filter IS NULL OR c.name ILIKE '%' || category_filter || '%')
    AND (search_query IS NULL OR 
         p.name ILIKE '%' || search_query || '%' OR 
         p.description ILIKE '%' || search_query || '%' OR
         p.public_description ILIKE '%' || search_query || '%')
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get public categories for a store
CREATE OR REPLACE FUNCTION public.get_public_categories(store_identifier TEXT)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  product_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    COUNT(p.id) as product_count
  FROM public.categories c
  INNER JOIN public.stores s ON c.store_id = s.id
  LEFT JOIN public.products p ON c.id = p.category_id AND p.is_public = true AND p.is_active = true
  WHERE s.enable_public_showcase = true
    AND (s.id::TEXT = store_identifier OR s.store_code = UPPER(store_identifier) OR s.showcase_slug = LOWER(store_identifier))
  GROUP BY c.id, c.name
  HAVING COUNT(p.id) > 0
  ORDER BY c.name;
END;
$$;

-- Function to generate a URL-friendly slug from store name
CREATE OR REPLACE FUNCTION public.generate_showcase_slug(store_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Create base slug: lowercase, replace spaces/special chars with hyphens, remove extra hyphens
  base_slug := LOWER(TRIM(store_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(base_slug, '-');

  -- Limit length to 50 characters
  base_slug := LEFT(base_slug, 50);
  base_slug := TRIM(base_slug, '-');

  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'store';
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness and add counter if needed
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.stores
      WHERE showcase_slug = final_slug
    ) INTO slug_exists;

    IF NOT slug_exists THEN
      EXIT;
    END IF;

    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.public_products TO anon, authenticated;
GRANT SELECT ON public.public_stores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_store_info(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_products(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_categories(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_showcase_slug(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.stores.enable_public_showcase IS 'Enable public showcase for this store';
COMMENT ON COLUMN public.stores.showcase_theme IS 'JSON configuration for showcase theme and styling';
COMMENT ON COLUMN public.stores.showcase_description IS 'Public description of the store for showcase';
COMMENT ON COLUMN public.stores.showcase_logo_url IS 'Logo URL for public showcase';
COMMENT ON COLUMN public.stores.showcase_banner_url IS 'Banner image URL for public showcase';
COMMENT ON COLUMN public.stores.showcase_contact_info IS 'JSON configuration for what contact info to show publicly';
COMMENT ON COLUMN public.stores.showcase_slug IS 'URL-friendly slug for short showcase links (e.g., johns-electronics)';

COMMENT ON COLUMN public.products.is_public IS 'Whether this product should be visible in public showcase';
COMMENT ON COLUMN public.products.public_description IS 'Public-facing description (can be different from internal description)';
COMMENT ON COLUMN public.products.show_stock_publicly IS 'Whether to show stock quantity in public showcase';
COMMENT ON COLUMN public.products.show_price_publicly IS 'Whether to show price in public showcase';

COMMENT ON VIEW public.public_products IS 'Read-only view of products that are marked as public';
COMMENT ON VIEW public.public_stores IS 'Read-only view of stores that have public showcase enabled';
