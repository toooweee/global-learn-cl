-- CreateEnum
CREATE TYPE "course_status" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "review_note" TEXT,
ADD COLUMN     "status" "course_status" NOT NULL DEFAULT 'PUBLISHED';
