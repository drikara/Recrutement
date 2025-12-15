/*
  Warnings:

  - The values [SUPERVISION_des_services] on the enum `Metier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Metier_new" AS ENUM ('CALL_CENTER', 'AGENCES', 'BO_RECLAM', 'TELEVENTE', 'RESEAUX_SOCIAUX', 'SUPERVISION', 'BOT_COGNITIVE_TRAINER', 'SMC_FIXE', 'SMC_MOBILE');
ALTER TABLE "recruitment_sessions" ALTER COLUMN "metier" TYPE "Metier_new" USING ("metier"::text::"Metier_new");
ALTER TABLE "candidates" ALTER COLUMN "metier" TYPE "Metier_new" USING ("metier"::text::"Metier_new");
ALTER TABLE "jury_members" ALTER COLUMN "specialite" TYPE "Metier_new" USING ("specialite"::text::"Metier_new");
ALTER TABLE "export_logs" ALTER COLUMN "metier" TYPE "Metier_new" USING ("metier"::text::"Metier_new");
ALTER TYPE "Metier" RENAME TO "Metier_old";
ALTER TYPE "Metier_new" RENAME TO "Metier";
DROP TYPE "public"."Metier_old";
COMMIT;

-- AlterTable
ALTER TABLE "face_to_face_scores" ADD COLUMN     "decision" "FFDecision",
ADD COLUMN     "simulation_capacite_persuasion" DECIMAL(3,2),
ADD COLUMN     "simulation_sens_combativite" DECIMAL(3,2),
ADD COLUMN     "simulation_sens_negociation" DECIMAL(3,2),
ALTER COLUMN "score" DROP NOT NULL;

-- AlterTable
ALTER TABLE "scores" ALTER COLUMN "simulation_sens_negociation" SET DATA TYPE DECIMAL(4,2),
ALTER COLUMN "simulation_capacite_persuasion" SET DATA TYPE DECIMAL(4,2),
ALTER COLUMN "simulation_sens_combativite" SET DATA TYPE DECIMAL(4,2);
