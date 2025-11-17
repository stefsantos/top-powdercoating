-- Assign admin role to existing user philipp_suarez@dlsu.edu.ph
INSERT INTO public.user_roles (user_id, role)
VALUES ('ad48188e-524f-410e-b445-032913907537', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;