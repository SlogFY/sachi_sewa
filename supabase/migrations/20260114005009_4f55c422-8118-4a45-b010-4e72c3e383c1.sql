-- Create a function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'owner'::app_role
  )
$$;

-- Create a function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner'::app_role, 'admin'::app_role)
  )
$$;

-- Update has_role function to also return true for owner when checking admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (role = 'owner'::app_role AND _role = 'admin'::app_role))
  )
$$;

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new RLS policies for user_roles
-- Owner can see all roles
CREATE POLICY "Owner can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_owner(auth.uid()));

-- Admins can see admin roles but not owner roles
CREATE POLICY "Admins can view admin roles"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND role != 'owner'::app_role
  AND NOT public.is_owner(user_id)
);

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Owner and admins can insert admin roles (not owner roles)
CREATE POLICY "Admins can insert admin roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  public.is_admin_or_owner(auth.uid())
  AND role = 'admin'::app_role
);

-- Only owner can delete roles, admins cannot delete owner
CREATE POLICY "Owner can delete any role"
ON public.user_roles
FOR DELETE
USING (public.is_owner(auth.uid()));

-- Admins can delete other admin roles (but not owner)
CREATE POLICY "Admins can delete admin roles"
ON public.user_roles
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND role = 'admin'::app_role
  AND NOT public.is_owner(user_id)
);