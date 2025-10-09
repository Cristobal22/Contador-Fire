-- migrations/20251203100000_fix_get_all_users_function.sql

-- Primero, eliminamos la función existente para evitar conflictos al cambiar el tipo de retorno.
DROP FUNCTION IF EXISTS get_all_users();

-- Ahora, recreamos la función con las correcciones necesarias:
-- 1. El tipo de dato de la columna 'email' en la tabla de retorno se cambia a character varying.
-- 2. La comprobación de rol se actualiza a 'System Administrator'.

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email character varying, -- Corregido: Coincide con auth.users.email
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    role TEXT
) AS $$
BEGIN
    -- Comprobación de Seguridad: Verificamos si el rol del usuario es 'System Administrator'.
    IF get_my_role() <> 'System Administrator' THEN -- Corregido: Rol actualizado
        RAISE EXCEPTION 'Acceso denegado: Se requiere rol de System Administrator.';
    END IF;

    -- Si la comprobación de seguridad pasa, ejecutamos la consulta.
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
