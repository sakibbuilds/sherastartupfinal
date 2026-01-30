-- Add admin roles for project owners
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('c75278d2-4e57-4ea4-916b-a256e3caf94d', 'admin'),
  ('8822b448-39ee-439b-a700-87942cab1080', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;