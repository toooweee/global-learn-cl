import { StepType } from '@generated/client';

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
  authorId: string;
  coverId?: string;
  modules: ModuleProps[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCourseProps {
  name: string;
  description: string;
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
}
