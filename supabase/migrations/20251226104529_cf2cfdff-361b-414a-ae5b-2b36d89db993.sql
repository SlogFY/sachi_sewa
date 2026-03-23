-- Fix donations RLS policy - change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can make donations" ON public.donations;

CREATE POLICY "Anyone can make donations" 
ON public.donations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Fix user_roles - allow admins to insert roles and allow authenticated users to insert their own role during signup
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert a default admin user (we'll create the auth user separately)
-- First, let's add a policy that allows users to insert their own role during signup (handled by trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (make them admin)
  IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin to first user
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();