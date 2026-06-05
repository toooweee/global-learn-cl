import { OnboardingStatus, OnboardingStepType } from '@generated/client';

export interface OnboardingProps {
  name: string;
  description: string;
  templateId?: string;
  assignedById: string;
  assignedToId: string;
  status: OnboardingStatus;
  startDate: Date;
  endDate: Date;
  completedAt?: Date;
  steps: OnboardingStepProps[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface OnboardingStepProps {
  id: string;
  position: number;
  name: string;
  description: string;
  type: OnboardingStepType;
  courseId?: string;
  recommendedStartDate: Date;
  recommendedEndDate: Date;
  feedbackText?: string;
  completedAt?: Date;
  feedbackOptions: OnboardingStepFeedbackOptionProps[];
  selectedOptionIds: string[];
}

export interface OnboardingStepFeedbackOptionProps {
  id: string;
  label: string;
}
