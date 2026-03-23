-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Creators can update their own draft campaigns" ON public.campaigns;

-- Create new update policy that:
-- USING: checks existing row is draft or rejected and belongs to user
-- WITH CHECK: allows the new status to be draft, pending, or rejected (user can only submit, not approve)
CREATE POLICY "Creators can update their own draft campaigns" 
ON public.campaigns 
FOR UPDATE 
USING (
  (auth.uid() = creator_id) AND 
  (status = ANY (ARRAY['draft'::text, 'rejected'::text]))
)
WITH CHECK (
  (auth.uid() = creator_id) AND 
  (status = ANY (ARRAY['draft'::text, 'pending'::text]))
);