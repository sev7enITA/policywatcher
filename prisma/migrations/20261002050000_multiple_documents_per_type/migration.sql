-- Keep distinct documents of the same type and jurisdiction. Preserve every row.
CREATE UNIQUE INDEX IF NOT EXISTS "Policy_companyId_type_jurisdiction_url_key" ON "Policy"("companyId", "type", "jurisdiction", "url");
DROP INDEX IF EXISTS "Policy_companyId_type_jurisdiction_key";
