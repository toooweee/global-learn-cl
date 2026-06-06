/*
  Warnings:

  - Made the column `updated_at` on table `client_companies` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `course_enrollments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `courses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `departments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `divisions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `lessons` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `onboarding_steps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `onboarding_template_steps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `onboarding_templates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `onboardings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `positions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `roles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `step_progress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `tests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "client_companies" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "course_enrollments" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "departments" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "divisions" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "lessons" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "onboarding_steps" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "onboarding_template_steps" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "onboarding_templates" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "onboardings" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "positions" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "step_progress" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "tests" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;
