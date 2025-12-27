/*
  Warnings:

  - Made the column `created_by_id` on table `recruitment_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "recruitment_sessions" DROP CONSTRAINT "recruitment_sessions_created_by_id_fkey";

-- AlterTable
ALTER TABLE "recruitment_sessions" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS',
ALTER COLUMN "created_by_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "recruitment_sessions" ADD CONSTRAINT "recruitment_sessions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
