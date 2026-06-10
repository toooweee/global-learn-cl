import { CourseScope, CourseStatus, StepType } from '@generated/client';

export { CourseScope, CourseStatus };

export interface StepProps {
  id: string;
  name: string;
  position: number;
  type: StepType;
  lessonId?: string;
  testId?: string;
}

export interface ModuleProps {
  id: string;
  name: string;
  position: number;
  steps: StepProps[];
}

export interface CourseProps {
  name: string;
  description: string;
  scope: CourseScope;
  status: CourseStatus;
  reviewNote?: string;
  departmentId?: string;
  divisionId?: string;
  authorId: string;
  coverId?: string;
  isArchived: boolean;
  modules: ModuleProps[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCourseProps {
  name: string;
  description: string;
  scope?: CourseScope;
  status?: CourseStatus;
  departmentId?: string;
  divisionId?: string;
  authorId: string;
  coverId?: string;
}

export interface AddModuleProps {
  name: string;
}

export interface AddStepProps {
  moduleId: string;
  name: string;
  type: StepType;
  lessonId?: string;
  testId?: string;
}

export interface UpdateCourseMetadataProps {
  name?: string;
  description?: string;
  coverId?: string | null;
  scope?: CourseScope;
  departmentId?: string | null;
  divisionId?: string | null;
}
