-- Add status and availability columns to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'busy', 'available')),
ADD COLUMN IF NOT EXISTS availability text DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'on_break', 'off_duty'));

-- Add updated_at timestamp
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_team_member_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_member_updated_at();