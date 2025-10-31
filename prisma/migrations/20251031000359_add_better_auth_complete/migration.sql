-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "scope" TEXT;

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");
