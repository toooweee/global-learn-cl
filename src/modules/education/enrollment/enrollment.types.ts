import { EnrollmentStatus } from '@generated/client';

export interface StepProgressProps {
  id: string;
  stepId: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface EnrollmentProps {
  courseId: string;
  employeeId: string;
  assignedById?: string;
  status: EnrollmentStatus;
  startedAt: Date;
  completedAt?: Date;
  progress: StepProgressProps[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateEnrollmentProps {
  courseId: string;
  employeeId: string;
  assignedById?: string;
}
