-- DropForeignKey
ALTER TABLE "onboarding_templates" DROP CONSTRAINT "onboarding_templates_position_id_fkey";

-- AlterTable
ALTER TABLE "onboarding_templates" ALTER COLUMN "position_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "onboarding_templates" ADD CONSTRAINT "onboarding_templates_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
