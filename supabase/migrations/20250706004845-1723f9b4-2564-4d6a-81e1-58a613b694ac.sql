-- Add store_code column to stores table for direct team member access
ALTER TABLE public.stores ADD COLUMN store_code text UNIQUE;

-- Generate store codes for existing stores (using first 4 chars of store name + random)
UPDATE public.stores 
SET store_code = UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 4) || LPAD((RANDOM() * 999)::int::text, 3, '0'))
WHERE store_code IS NULL;

-- Make store_code required for new stores
ALTER TABLE public.stores ALTER COLUMN store_code SET NOT NULL;

-- Add index for faster lookups
CREATE INDEX idx_stores_store_code ON public.stores(store_code);