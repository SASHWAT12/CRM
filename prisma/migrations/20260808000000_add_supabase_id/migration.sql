-- AlterTable
ALTER TABLE "Users" ADD COLUMN "supabase_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_supabase_id_key" ON "Users"("supabase_id");
