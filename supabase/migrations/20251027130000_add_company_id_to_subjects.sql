ALTER TABLE "public"."subjects"
ADD COLUMN "company_id" bigint;

ALTER TABLE "public"."subjects"
ADD CONSTRAINT "subjects_company_id_fkey"
FOREIGN KEY ("company_id")
REFERENCES "public"."companies"("id")
ON UPDATE NO ACTION
ON DELETE NO ACTION;
