-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Team members can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Team members can update assigned order status" ON public.orders;

-- Create a security definer function to check if user is assigned to an order
CREATE OR REPLACE FUNCTION public.is_team_member_assigned_to_order(_user_id uuid, _order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_team_assignments ota
    JOIN public.team_members tm ON tm.id = ota.team_member_id
    WHERE ota.order_id = _order_id
    AND tm.user_id = _user_id
  )
$$;

-- Recreate the policies using the security definer function
CREATE POLICY "Team members can view assigned orders"
ON public.orders
FOR SELECT
USING (public.is_team_member_assigned_to_order(auth.uid(), id));

CREATE POLICY "Team members can update assigned order status"
ON public.orders
FOR UPDATE
USING (public.is_team_member_assigned_to_order(auth.uid(), id))
WITH CHECK (public.is_team_member_assigned_to_order(auth.uid(), id));