-- migrations/YYYYMMDDHHMMSS_add_admin_users_view.sql

-- Primero, creamos o reemplazamos una función auxiliar para obtener el rol del usuario actual.
-- Esto nos permite verificar los permisos de forma centralizada.
-- La cláusula SECURITY DEFINER es crucial, ya que permite que la función se ejecute con los permisos del usuario que la definió (el administrador),
-- permitiendo así el acceso a la tabla `profiles` que tiene RLS activado.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Obtenemos el rol desde la tabla `profiles` para el usuario que está realizando la llamada (auth.uid()).
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ahora, la función principal para obtener todos los usuarios.
-- Esta función también es SECURITY DEFINER para poder saltar el RLS de la tabla `auth.users`.
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    role TEXT
) AS $$
BEGIN
    -- Comprobación de Seguridad: Antes de devolver ningún dato, verificamos si el rol del usuario es 'admin'.
    -- Si no lo es, lanzamos una excepción y la función se detiene inmediatamente.
    IF get_my_role() <> 'admin' THEN
        RAISE EXCEPTION 'Acceso denegado: Se requiere rol de administrador.';
    END IF;

    -- Si la comprobación de seguridad pasa, ejecutamos la consulta.
    -- Unimos auth.users con public.profiles para obtener el rol de cada usuario.
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        p.role
    FROM
        auth.users u
    LEFT JOIN
        public.profiles p ON u.id = p.id
    ORDER BY
        u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
