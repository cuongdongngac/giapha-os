-- Create storage bucket for posts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the posts bucket
-- 1. Allow public read access to thumbnails
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'posts');

-- 2. Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.role() = 'authenticated'
);

-- 3. Allow admins to update/delete
CREATE POLICY "Admin Delete/Update" 
ON storage.objects FOR ALL
USING (
  bucket_id = 'posts' 
  AND auth.role() = 'authenticated'
);
