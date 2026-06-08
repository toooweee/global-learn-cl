-- CreateEnum
CREATE TYPE "course_scope" AS ENUM ('ALL', 'DEPARTMENT', 'DIVISION');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "department_id" UUID,
ADD COLUMN     "division_id" UUID,
ADD COLUMN     "scope" "course_scope" NOT NULL DEFAULT 'ALL';

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
