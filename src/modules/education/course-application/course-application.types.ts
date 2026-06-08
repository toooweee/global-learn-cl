import { ApplicationStatus } from '@generated/client';

export interface CourseApplicationProps {
  courseId: string;
  employeeId: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCourseApplicationProps {
  courseId: string;
  employeeId: string;
}
