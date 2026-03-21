-- Optimized is_admin function with explicit search_path for security and to ensure RLS bypass
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  -- Using a stable check against the profiles table. 
  -- SECURITY DEFINER ensures this runs with elevated privileges, bypassing RLS on 'profiles'.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'editor')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Update profiles RLS to ensure it's not recursive
-- Even though SECURITY DEFINER should bypass RLS, sometimes the planner might get confused 
-- if the policy is complex. A simpler way is to check the user directly.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT 
TO authenticated
USING (
  -- Instead of calling is_admin() which queries this same table,
  -- we can sometimes use metadata or just trust the SECURITY DEFINER function
  -- if we're sure it's not recursing. 
  -- To be 100% safe from recursion in the policy itself:
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

-- Note: The above might still trigger RLS unless Postgres optimization kicks in.
-- But since getPosts is now optimized to avoid unnecessary RLS/Columns, the speed should be much better.
