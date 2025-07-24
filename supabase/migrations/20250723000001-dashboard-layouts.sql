-- Migration: Dashboard Layouts
-- Description: Add support for custom dashboard layouts and user preferences
-- Date: 2025-07-23

-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id TEXT PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  widgets JSONB NOT NULL DEFAULT '[]',
  theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  refresh_interval INTEGER NOT NULL DEFAULT 300,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_store_id ON public.dashboard_layouts(store_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_active ON public.dashboard_layouts(store_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_updated ON public.dashboard_layouts(store_id, updated_at DESC);

-- Create unique constraint to ensure only one active layout per store
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_layouts_store_active 
ON public.dashboard_layouts(store_id) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their store's dashboard layouts"
ON public.dashboard_layouts FOR SELECT
USING (
  store_id IN (
    SELECT s.id FROM public.stores s
    WHERE s.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = s.id
      AND sm.user_id = auth.uid()
      AND sm.is_active = true
    )
  )
);

CREATE POLICY "Users can create dashboard layouts for their stores"
ON public.dashboard_layouts FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT s.id FROM public.stores s
    WHERE s.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = s.id
      AND sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role IN ('owner', 'manager')
    )
  )
);

CREATE POLICY "Users can update their store's dashboard layouts"
ON public.dashboard_layouts FOR UPDATE
USING (
  store_id IN (
    SELECT s.id FROM public.stores s
    WHERE s.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = s.id
      AND sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role IN ('owner', 'manager')
    )
  )
);

CREATE POLICY "Users can delete their store's dashboard layouts"
ON public.dashboard_layouts FOR DELETE
USING (
  store_id IN (
    SELECT s.id FROM public.stores s
    WHERE s.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = s.id
      AND sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role IN ('owner', 'manager')
    )
  )
  AND is_default = false -- Prevent deletion of default layouts
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_layout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_dashboard_layouts_updated_at
  BEFORE UPDATE ON public.dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_layout_updated_at();

-- Create function to ensure only one active layout per store
CREATE OR REPLACE FUNCTION ensure_single_active_layout()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a layout as active, deactivate all others for the same store
  IF NEW.is_active = true THEN
    UPDATE public.dashboard_layouts
    SET is_active = false
    WHERE store_id = NEW.store_id
    AND id != NEW.id
    AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single active layout
CREATE TRIGGER trigger_ensure_single_active_layout
  BEFORE INSERT OR UPDATE ON public.dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_layout();

-- Insert default layouts for existing stores
INSERT INTO public.dashboard_layouts (
  id,
  store_id,
  name,
  widgets,
  theme,
  compact_mode,
  refresh_interval,
  is_active,
  is_default
)
SELECT 
  'default-' || s.id,
  s.id,
  'Default Layout',
  '[
    {
      "id": "revenue-metric",
      "name": "Total Revenue",
      "type": "metric",
      "icon": "DollarSign",
      "enabled": true,
      "position": {"row": 0, "col": 0, "width": 1, "height": 1}
    },
    {
      "id": "orders-metric",
      "name": "Total Orders",
      "type": "metric",
      "icon": "ShoppingCart",
      "enabled": true,
      "position": {"row": 0, "col": 1, "width": 1, "height": 1}
    },
    {
      "id": "customers-metric",
      "name": "Total Customers",
      "type": "metric",
      "icon": "Users",
      "enabled": true,
      "position": {"row": 0, "col": 2, "width": 1, "height": 1}
    },
    {
      "id": "products-metric",
      "name": "Total Products",
      "type": "metric",
      "icon": "Package",
      "enabled": true,
      "position": {"row": 0, "col": 3, "width": 1, "height": 1}
    },
    {
      "id": "revenue-chart",
      "name": "Revenue Trend",
      "type": "chart",
      "icon": "TrendingUp",
      "enabled": true,
      "position": {"row": 1, "col": 0, "width": 2, "height": 2}
    },
    {
      "id": "category-chart",
      "name": "Sales by Category",
      "type": "chart",
      "icon": "PieChart",
      "enabled": true,
      "position": {"row": 1, "col": 2, "width": 1, "height": 2}
    },
    {
      "id": "recent-transactions",
      "name": "Recent Transactions",
      "type": "list",
      "icon": "BarChart3",
      "enabled": true,
      "position": {"row": 2, "col": 0, "width": 3, "height": 1}
    }
  ]'::jsonb,
  'auto',
  false,
  300,
  true,
  true
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.dashboard_layouts dl
  WHERE dl.store_id = s.id
);

-- Create function to create default layout for new stores
CREATE OR REPLACE FUNCTION create_default_dashboard_layout()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dashboard_layouts (
    id,
    store_id,
    name,
    widgets,
    theme,
    compact_mode,
    refresh_interval,
    is_active,
    is_default
  ) VALUES (
    'default-' || NEW.id,
    NEW.id,
    'Default Layout',
    '[
      {
        "id": "revenue-metric",
        "name": "Total Revenue",
        "type": "metric",
        "icon": "DollarSign",
        "enabled": true,
        "position": {"row": 0, "col": 0, "width": 1, "height": 1}
      },
      {
        "id": "orders-metric",
        "name": "Total Orders",
        "type": "metric",
        "icon": "ShoppingCart",
        "enabled": true,
        "position": {"row": 0, "col": 1, "width": 1, "height": 1}
      },
      {
        "id": "customers-metric",
        "name": "Total Customers",
        "type": "metric",
        "icon": "Users",
        "enabled": true,
        "position": {"row": 0, "col": 2, "width": 1, "height": 1}
      },
      {
        "id": "products-metric",
        "name": "Total Products",
        "type": "metric",
        "icon": "Package",
        "enabled": true,
        "position": {"row": 0, "col": 3, "width": 1, "height": 1}
      },
      {
        "id": "revenue-chart",
        "name": "Revenue Trend",
        "type": "chart",
        "icon": "TrendingUp",
        "enabled": true,
        "position": {"row": 1, "col": 0, "width": 2, "height": 2}
      },
      {
        "id": "category-chart",
        "name": "Sales by Category",
        "type": "chart",
        "icon": "PieChart",
        "enabled": true,
        "position": {"row": 1, "col": 2, "width": 1, "height": 2}
      },
      {
        "id": "recent-transactions",
        "name": "Recent Transactions",
        "type": "list",
        "icon": "BarChart3",
        "enabled": true,
        "position": {"row": 2, "col": 0, "width": 3, "height": 1}
      }
    ]'::jsonb,
    'auto',
    false,
    300,
    true,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create default layout for new stores
CREATE TRIGGER trigger_create_default_dashboard_layout
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION create_default_dashboard_layout();
