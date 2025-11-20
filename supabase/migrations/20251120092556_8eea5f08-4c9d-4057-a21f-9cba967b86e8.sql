-- Create team_members table for admin assignment
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert team members"
  ON public.team_members FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update team members"
  ON public.team_members FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete team members"
  ON public.team_members FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create messages table for client inquiries
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update messages"
  ON public.messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Create order_team_assignments junction table
CREATE TABLE IF NOT EXISTS public.order_team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, team_member_id)
);

-- Enable RLS
ALTER TABLE public.order_team_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_team_assignments
CREATE POLICY "Users can view team assignments for their orders"
  ON public.order_team_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_team_assignments.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all team assignments"
  ON public.order_team_assignments FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert team assignments"
  ON public.order_team_assignments FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete team assignments"
  ON public.order_team_assignments FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Insert some initial team members
INSERT INTO public.team_members (name, role, department) VALUES
  ('John Santos', 'Lead Technician', 'Production'),
  ('Maria Cruz', 'Quality Inspector', 'Quality Control'),
  ('Pedro Reyes', 'Coating Specialist', 'Production'),
  ('Ana Garcia', 'Sand Blasting Tech', 'Preparation'),
  ('Jose Mendoza', 'Curing Specialist', 'Production')
ON CONFLICT DO NOTHING;