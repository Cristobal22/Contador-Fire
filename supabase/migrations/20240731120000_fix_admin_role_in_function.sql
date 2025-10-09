-- migrations/20240731120000_fix_admin_role_in_function.sql

-- Actualizamos la función para que utilice el rol 'System Administrator' en la comprobación de seguridad.
-- Esto alinea la lógica de la base de datos con la lógica del frontend.
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    role TEXT
) AS $$
BEGIN
    -- Comprobación de Seguridad Corregida: Verificamos si el rol del usuario es 'System Administrator'.
    IF get_my_role() <> 'System Administrator' THEN
        RAISE EXCEPTION 'Acceso denegado: Se requiere rol de administrador.';
    END IF;

    -- Si la comprobación de seguridad pasa, la consulta se ejecuta como antes.
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
