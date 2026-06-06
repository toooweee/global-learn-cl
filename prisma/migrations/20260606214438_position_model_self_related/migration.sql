-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "parent_id" UUID;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
