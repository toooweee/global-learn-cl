CREATE TABLE IF NOT EXISTS "courses" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"description" TEXT NOT NULL,
	"author_id" UUID NOT NULL,
	"coverId" INTEGER,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "files" (
	"id" UUID NOT NULL,
	"url" VARCHAR(255) NOT NULL,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "modules" (
	"id" UUID NOT NULL,
	"course_id" UUID NOT NULL,
	"position" INTEGER NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "steps" (
	"id" UUID NOT NULL,
	"module_id" UUID NOT NULL,
	"position" INTEGER NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "tests" (
	"id" UUID NOT NULL,
	"name" TEXT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "test_attempts" (
	"id" UUID NOT NULL,
	"test_id" UUID NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"ended_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "course_questions" (
	"id" UUID NOT NULL,
	"question" VARCHAR(255) NOT NULL,
	"course_id" UUID NOT NULL,
	"module_id" UUID,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "course_answers" (
	"id" UUID NOT NULL,
	"answer" VARCHAR(255) NOT NULL,
	"is_correct" BOOLEAN NOT NULL DEFAULT FALSE,
	"question_id" UUID NOT NULL,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "test_questions" (
	"id" UUID NOT NULL,
	"test_id" UUID NOT NULL,
	"question_id" UUID NOT NULL,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "test_attempt_answers" (
	"id" UUID NOT NULL,
	"option" VARCHAR(255) NOT NULL,
	"attempt_id" UUID NOT NULL,
	"question_id" UUID NOT NULL,
	"answer_id" UUID NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "onboarding_templates" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"description" TEXT NOT NULL,
	"coverId" INTEGER,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "users" (
	"id" UUID NOT NULL,
	"email" VARCHAR(255) NOT NULL UNIQUE,
	"hashedPassword" VARCHAR(255) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "employees" (
	"id" UUID NOT NULL,
	"fullname" VARCHAR(255) NOT NULL,
	"biography" TEXT,
	"employment_date" TIMESTAMPTZ NOT NULL,
	"dismissal_date" TIMESTAMPTZ,
	"division_id" UUID NOT NULL,
	"avatar_id" UUID,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "departments" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL UNIQUE,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "divisions" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL UNIQUE,
	"department_id" UUID NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "clients" (
	"id" UUID NOT NULL,
	"fullname" VARCHAR(255) NOT NULL,
	"avatar_id" UUID,
	"company_id" UUID NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "client_companies" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"avatar_id" UUID,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "onboardings" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"description" TEXT NOT NULL,
	"assigned_by" UUID NOT NULL,
	"assigned_to" UUID NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "positions" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL UNIQUE,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "onboarding_template_steps" (
	"id" UUID NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"description" TEXT NOT NULL,
	"coverId" INTEGER,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);




CREATE TABLE IF NOT EXISTS "lesson" (
	"id" UUID NOT NULL,
	"name" TEXT NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);



ALTER TABLE "modules"
ADD FOREIGN KEY("course_id") REFERENCES "courses"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "steps"
ADD FOREIGN KEY("module_id") REFERENCES "modules"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "course_questions"
ADD FOREIGN KEY("course_id") REFERENCES "courses"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "course_questions"
ADD FOREIGN KEY("module_id") REFERENCES "modules"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "course_answers"
ADD FOREIGN KEY("question_id") REFERENCES "course_questions"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "test_questions"
ADD FOREIGN KEY("test_id") REFERENCES "tests"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "test_questions"
ADD FOREIGN KEY("question_id") REFERENCES "course_questions"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "test_attempts"
ADD FOREIGN KEY("test_id") REFERENCES "tests"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "test_attempt_answers"
ADD FOREIGN KEY("attempt_id") REFERENCES "test_attempts"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "test_attempt_answers"
ADD FOREIGN KEY("question_id") REFERENCES "course_questions"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "test_attempt_answers"
ADD FOREIGN KEY("answer_id") REFERENCES "course_answers"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "courses"
ADD FOREIGN KEY("coverId") REFERENCES "files"("id")
ON UPDATE NO ACTION ON DELETE SET NULL;
ALTER TABLE "employees"
ADD FOREIGN KEY("id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "divisions"
ADD FOREIGN KEY("department_id") REFERENCES "departments"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "employees"
ADD FOREIGN KEY("division_id") REFERENCES "divisions"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "courses"
ADD FOREIGN KEY("author_id") REFERENCES "employees"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "clients"
ADD FOREIGN KEY("id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "clients"
ADD FOREIGN KEY("company_id") REFERENCES "client_companies"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;