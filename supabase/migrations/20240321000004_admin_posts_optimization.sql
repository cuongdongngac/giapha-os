-- Additional optimization for admin posts view
-- Add composite index for admin sorting (status + updated_at)
-- This will make admin queries much faster by optimizing the sorting order

CREATE INDEX IF NOT EXISTS idx_posts_admin_sort 
ON public.posts(status DESC NULLS LAST, updated_at DESC NULLS LAST);

-- Add index for status filtering (useful for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_posts_status_simple 
ON public.posts(status);

-- Comment: These indexes will significantly improve admin dashboard performance
-- by optimizing the most common admin query patterns
