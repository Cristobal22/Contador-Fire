
-- 1. Añadir la columna user_id a la tabla de compañías para vincularla a un usuario.
ALTER TABLE "public"."companies"
ADD COLUMN "user_id" uuid REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- 2. Activar la Seguridad a Nivel de Fila (RLS) en las tablas principales.
ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chart_of_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;
-- Añade aquí cualquier otra tabla que deba ser aislada, como "employees" o "vouchers".

-- 3. Crear Políticas de RLS para la tabla de compañías.
-- Los usuarios pueden ver las compañías que les pertenecen.
CREATE POLICY "Enable read access for user's own companies"
ON "public"."companies"
FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden crear compañías para sí mismos.
CREATE POLICY "Enable insert for user's own companies"
ON "public"."companies"
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Crear Políticas de RLS para tablas vinculadas.
-- El patrón se repite: un usuario puede acceder a un dato si pertenece a una de sus compañías.
CREATE POLICY "Enable all access for user's companies"
ON "public"."chart_of_accounts"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "public"."companies"
    WHERE "companies"."id" = "chart_of_accounts"."company_id" AND "companies"."user_id" = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."companies"
    WHERE "companies"."id" = "chart_of_accounts"."company_id" AND "companies"."user_id" = auth.uid()
  )
);

CREATE POLICY "Enable all access for user's companies"
ON "public"."subjects"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "public"."companies"
    WHERE "companies"."id" = "subjects"."company_id" AND "companies"."user_id" = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."companies"
    WHERE "companies"."id" = "subjects"."company_id" AND "companies"."user_id" = auth.uid()
  )
);
