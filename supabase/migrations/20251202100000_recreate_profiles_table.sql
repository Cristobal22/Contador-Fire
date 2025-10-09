
-- Script de migración idempotente para recrear la tabla `profiles`.

-- 0. Eliminar el trigger y la tabla existentes para evitar conflictos.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Crear la tabla `profiles` de nuevo.
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  website text,
  role text
);

-- 2. Añadir comentarios.
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user.';
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario dentro del sistema (ej. System Administrator, Accountant).';

-- 3. Habilitar RLS.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de RLS.
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING ( true );

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );

-- 5. Crear la función trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Asigna el rol por defecto 'Accountant'.
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'Accountant');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear y vincular el trigger a auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
