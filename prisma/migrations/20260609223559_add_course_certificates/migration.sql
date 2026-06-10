-- CreateTable
CREATE TABLE "course_certificates" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "course_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_certificates_enrollment_id_key" ON "course_certificates"("enrollment_id");

-- CreateIndex
CREATE INDEX "course_certificates_employee_id_idx" ON "course_certificates"("employee_id");

-- AddForeignKey
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
