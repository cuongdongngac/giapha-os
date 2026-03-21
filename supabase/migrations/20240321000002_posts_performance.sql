-- 1. Create a security definer function to check if the current user is an admin or editor.
-- This is much faster than using a subquery in every RLS policy check.
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'editor')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Update RLS policies on the 'posts' table to use the new function.
-- First, drop the old ones if they exist (adjust names if they differ in your DB).
DROP POLICY IF EXISTS "Admin All Access" ON posts;
DROP POLICY IF EXISTS "Public Read Access" ON posts;

-- Admin/Editor: Full access to all posts using the fast is_admin() check.
CREATE POLICY "Admin All Access" ON public.posts
FOR ALL 
TO authenticated 
USING (public.is_admin());

-- Public: Read only published posts.
CREATE POLICY "Public Read Access" ON public.posts
FOR SELECT 
USING (status = 'published');

-- 3. Add indexes to speed up common sorting and filtering operations.
-- Index for the default public list (published posts ordered by date).
CREATE INDEX IF NOT EXISTS idx_posts_status_published ON public.posts(status, published_at DESC);

-- Index for admin list (all posts ordered by creation date as fallback).
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Index for fast slug lookups.
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
