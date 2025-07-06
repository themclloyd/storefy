-- Remove the initialize_sample_data function as we're now using real data only
-- This function was used to populate new stores with sample data, but we want users to add their own real data

DROP FUNCTION IF EXISTS public.initialize_sample_data(UUID);
