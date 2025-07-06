-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policy for product images
CREATE POLICY "Users can upload product images for their stores" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid()::text = (storage.foldername(name))[1] OR
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id::text = (storage.foldername(name))[1] 
    AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.store_members sm
    JOIN public.stores s ON s.id = sm.store_id
    WHERE s.id::text = (storage.foldername(name))[1]
    AND sm.user_id = auth.uid()
    AND sm.is_active = true
  )
);

CREATE POLICY "Users can view product images for their stores" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id::text = (storage.foldername(name))[1] 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.store_members sm
      JOIN public.stores s ON s.id = sm.store_id
      WHERE s.id::text = (storage.foldername(name))[1]
      AND sm.user_id = auth.uid()
      AND sm.is_active = true
    )
  )
);

CREATE POLICY "Users can update product images for their stores" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id::text = (storage.foldername(name))[1] 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.store_members sm
      JOIN public.stores s ON s.id = sm.store_id
      WHERE s.id::text = (storage.foldername(name))[1]
      AND sm.user_id = auth.uid()
      AND sm.is_active = true
    )
  )
);

CREATE POLICY "Users can delete product images for their stores" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id::text = (storage.foldername(name))[1] 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.store_members sm
      JOIN public.stores s ON s.id = sm.store_id
      WHERE s.id::text = (storage.foldername(name))[1]
      AND sm.user_id = auth.uid()
      AND sm.is_active = true
    )
  )
);
