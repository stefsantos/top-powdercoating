-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own order files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'order-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view their own order files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'order-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all order files
CREATE POLICY "Admins can view all order files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'order-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Public read access for the bucket (since it's public)
CREATE POLICY "Public read access for order files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'order-files');