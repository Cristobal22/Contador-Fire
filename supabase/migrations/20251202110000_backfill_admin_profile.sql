-- Migración para asegurar que el usuario administrador principal tenga un perfil.

INSERT INTO public.profiles (id, role, full_name)
SELECT
  id,
  'System Administrator',
  'Admin User' -- Un nombre de marcador de posición para el perfil.
FROM auth.users
WHERE email = 'cvillalobosn22@gmail.com'
-- En caso de que el perfil ya exista por alguna razón, esta línea evita un error.
ON CONFLICT (id) DO NOTHING;
