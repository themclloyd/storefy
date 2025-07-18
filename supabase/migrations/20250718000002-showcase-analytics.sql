-- Migration: Showcase Analytics Tracking
-- Description: Add analytics tracking for showcase views, clicks, and shares
-- Date: 2025-07-18

-- Create showcase analytics table
CREATE TABLE IF NOT EXISTS public.showcase_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'product_click', 'share', 'contact_click')),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_showcase_analytics_store_id 
ON public.showcase_analytics(store_id);

CREATE INDEX IF NOT EXISTS idx_showcase_analytics_event_type 
ON public.showcase_analytics(store_id, event_type);

CREATE INDEX IF NOT EXISTS idx_showcase_analytics_product_id 
ON public.showcase_analytics(product_id, event_type);

CREATE INDEX IF NOT EXISTS idx_showcase_analytics_created_at 
ON public.showcase_analytics(created_at);

-- Function to get showcase analytics summary
CREATE OR REPLACE FUNCTION public.get_showcase_analytics(store_identifier TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_views BIGINT,
  total_shares BIGINT,
  total_product_clicks BIGINT,
  total_contact_clicks BIGINT,
  most_clicked_product_id UUID,
  most_clicked_product_name TEXT,
  most_clicked_product_clicks BIGINT,
  views_this_month BIGINT,
  views_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_store_id UUID;
BEGIN
  -- Get store ID from identifier
  SELECT s.id INTO target_store_id
  FROM public.stores s
  WHERE s.id::TEXT = store_identifier 
     OR s.store_code = UPPER(store_identifier) 
     OR s.showcase_slug = LOWER(store_identifier)
  LIMIT 1;

  IF target_store_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH analytics_summary AS (
    SELECT 
      COUNT(*) FILTER (WHERE event_type = 'view') as total_views,
      COUNT(*) FILTER (WHERE event_type = 'share') as total_shares,
      COUNT(*) FILTER (WHERE event_type = 'product_click') as total_product_clicks,
      COUNT(*) FILTER (WHERE event_type = 'contact_click') as total_contact_clicks,
      COUNT(*) FILTER (WHERE event_type = 'view' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as views_this_month,
      COUNT(*) FILTER (WHERE event_type = 'view' AND created_at >= CURRENT_DATE) as views_today
    FROM public.showcase_analytics sa
    WHERE sa.store_id = target_store_id
      AND sa.created_at >= CURRENT_DATE - INTERVAL '365 days'
  ),
  most_clicked AS (
    SELECT 
      sa.product_id,
      p.name as product_name,
      COUNT(*) as click_count
    FROM public.showcase_analytics sa
    LEFT JOIN public.products p ON sa.product_id = p.id
    WHERE sa.store_id = target_store_id
      AND sa.event_type = 'product_click'
      AND sa.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND sa.product_id IS NOT NULL
    GROUP BY sa.product_id, p.name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(a.total_views, 0),
    COALESCE(a.total_shares, 0),
    COALESCE(a.total_product_clicks, 0),
    COALESCE(a.total_contact_clicks, 0),
    m.product_id,
    m.product_name,
    COALESCE(m.click_count, 0),
    COALESCE(a.views_this_month, 0),
    COALESCE(a.views_today, 0)
  FROM analytics_summary a
  LEFT JOIN most_clicked m ON true;
END;
$$;

-- Function to track showcase events
CREATE OR REPLACE FUNCTION public.track_showcase_event(
  store_identifier TEXT,
  event_type TEXT,
  product_id UUID DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL,
  referrer TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_store_id UUID;
BEGIN
  -- Get store ID from identifier
  SELECT s.id INTO target_store_id
  FROM public.stores s
  WHERE s.id::TEXT = store_identifier 
     OR s.store_code = UPPER(store_identifier) 
     OR s.showcase_slug = LOWER(store_identifier)
  LIMIT 1;

  IF target_store_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Insert analytics event
  INSERT INTO public.showcase_analytics (
    store_id,
    event_type,
    product_id,
    user_agent,
    ip_address,
    referrer
  ) VALUES (
    target_store_id,
    event_type,
    product_id,
    user_agent,
    ip_address::INET,
    referrer
  );

  RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.showcase_analytics TO authenticated;
GRANT INSERT ON public.showcase_analytics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_showcase_analytics(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_showcase_event(TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Add comments
COMMENT ON TABLE public.showcase_analytics IS 'Analytics tracking for showcase views, clicks, and interactions';
COMMENT ON FUNCTION public.get_showcase_analytics(TEXT, INTEGER) IS 'Get analytics summary for a store showcase';
COMMENT ON FUNCTION public.track_showcase_event(TEXT, TEXT, UUID, TEXT, TEXT, TEXT) IS 'Track showcase events like views, clicks, shares';
