-- Add team_member role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'team_member';

-- Add email and user_id to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS email text UNIQUE,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);

-- Update RLS policies for team members to view their own assignments
CREATE POLICY "Team members can view their own assignments"
ON public.order_team_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.id = order_team_assignments.team_member_id
    AND team_members.user_id = auth.uid()
  )
);

-- Team members can view orders they're assigned to
CREATE POLICY "Team members can view assigned orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_team_assignments
    JOIN public.team_members ON team_members.id = order_team_assignments.team_member_id
    WHERE order_team_assignments.order_id = orders.id
    AND team_members.user_id = auth.uid()
  )
);

-- Team members can update status of orders they're assigned to
CREATE POLICY "Team members can update assigned order status"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.order_team_assignments
    JOIN public.team_members ON team_members.id = order_team_assignments.team_member_id
    WHERE order_team_assignments.order_id = orders.id
    AND team_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_team_assignments
    JOIN public.team_members ON team_members.id = order_team_assignments.team_member_id
    WHERE order_team_assignments.order_id = orders.id
    AND team_members.user_id = auth.uid()
  )
);

-- Team members can view their own profile
CREATE POLICY "Team members can view own profile"
ON public.team_members
FOR SELECT
USING (user_id = auth.uid());

-- Team members can update their own availability/status
CREATE POLICY "Team members can update own status"
ON public.team_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create function to notify on task completion
CREATE OR REPLACE FUNCTION public.notify_on_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  team_member_name TEXT;
  admin_user_id UUID;
BEGIN
  -- Only trigger when status changes to completed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed') THEN
    -- Get team member name
    SELECT name INTO team_member_name
    FROM public.team_members
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Notify all admins
    FOR admin_user_id IN 
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.messages (user_id, order_id, subject, message, priority, is_read)
      VALUES (
        admin_user_id,
        NEW.id,
        'Order Completed by Team Member',
        'Team member ' || COALESCE(team_member_name, 'Unknown') || ' has marked order ' || NEW.order_number || ' as completed.',
        'high',
        false
      );
    END LOOP;
    
    -- Notify the client
    INSERT INTO public.messages (user_id, order_id, subject, message, priority, is_read)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Your Order is Complete! 🎉',
      'Great news! Your order ' || NEW.order_number || ' has been completed by our team.',
      'high',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task completion notifications
DROP TRIGGER IF EXISTS on_task_completion ON public.orders;
CREATE TRIGGER on_task_completion
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_task_completion();