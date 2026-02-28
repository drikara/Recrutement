-- Création de l'enum AgenceType
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgenceType') THEN
        CREATE TYPE "AgenceType" AS ENUM ('ABIDJAN', 'INTERIEUR');
    END IF;
END$$;

-- Ajout sur recruitment_sessions uniquement
ALTER TABLE "recruitment_sessions" ADD COLUMN IF NOT EXISTS "agence_type" "AgenceType";
