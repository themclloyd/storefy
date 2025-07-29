-- Migration: Dashboard Settings
-- Description: Add support for user dashboard settings and preferences
-- Date: 2025-07-29

-- Create dashboard_settings table
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one settings record per store
  UNIQUE(store_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_settings_store_id ON public.dashboard_settings(store_id);

-- Enable RLS
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their store's dashboard settings"
  ON public.dashboard_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = dashboard_settings.store_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their store's dashboard settings"
  ON public.dashboard_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = dashboard_settings.store_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their store's dashboard settings"
  ON public.dashboard_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = dashboard_settings.store_id
      AND su.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their store's dashboard settings"
  ON public.dashboard_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = dashboard_settings.store_id
      AND su.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_dashboard_settings_updated_at
  BEFORE UPDATE ON public.dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_settings_updated_at();

-- Insert default settings for existing stores
INSERT INTO public.dashboard_settings (store_id, settings)
SELECT 
  s.id,
  '{
    "theme": "auto",
    "compactMode": false,
    "refreshInterval": 300,
    "showAnimations": true,
    "autoRefresh": true,
    "chartPeriod": "daily",
    "currency": "USD",
    "dateFormat": "US",
    "showWelcomeMessage": true
  }'::jsonb
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.dashboard_settings ds
  WHERE ds.store_id = s.id
);

-- Create function to create default settings for new stores
CREATE OR REPLACE FUNCTION create_default_dashboard_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dashboard_settings (store_id, settings)
  VALUES (
    NEW.id,
    '{
      "theme": "auto",
      "compactMode": false,
      "refreshInterval": 300,
      "showAnimations": true,
      "autoRefresh": true,
      "chartPeriod": "daily",
      "currency": "USD",
      "dateFormat": "US",
      "showWelcomeMessage": true
    }'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create default settings for new stores
CREATE TRIGGER trigger_create_default_dashboard_settings
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION create_default_dashboard_settings();

-- Grant permissions
GRANT ALL ON public.dashboard_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
