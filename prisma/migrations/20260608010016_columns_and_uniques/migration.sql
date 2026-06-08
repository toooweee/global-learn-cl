/*
  Warnings:

  - A unique constraint covering the columns `[enrollment_id]` on the table `onboarding_steps` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "onboarding_templates_position_id_division_id_key";

-- AlterTable
ALTER TABLE "course_enrollments" ADD COLUMN     "assigned_by_id" UUID,
ADD COLUMN     "current_step_id" UUID;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "divisions" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "birth_date" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "content" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "video_id" UUID;

-- AlterTable
ALTER TABLE "onboarding_steps" ADD COLUMN     "enrollment_id" UUID;

-- AlterTable
ALTER TABLE "test_attempts" ADD COLUMN     "is_passed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "score" INTEGER;

-- AlterTable
ALTER TABLE "tests" ADD COLUMN     "passing_percent" INTEGER NOT NULL DEFAULT 80;

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_steps_enrollment_id_key" ON "onboarding_steps"("enrollment_id");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_steps" ADD CONSTRAINT "onboarding_steps_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
