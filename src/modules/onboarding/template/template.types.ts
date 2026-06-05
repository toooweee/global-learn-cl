import { OnboardingStepType } from '@generated/client';

export interface OnboardingTemplateProps {
  name: string;
  description: string;
  positionId: string;
  divisionId: string;
  coverId?: string;
  steps: OnboardingTemplateStepProps[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateOnboardingTemplateProps {
  name: string;
  description: string;
  positionId: string;
  divisionId: string;
  coverId?: string;
  steps: CreateOnboardingTemplateStepProps[];
}

export interface OnboardingTemplateStepProps {
  id: string;
  position: number;
  name: string;
  description: string;
  type: OnboardingStepType;
  courseId?: string;
  recommendedStartOffsetDays: number;
  recommendedEndOffsetDays: number;
  coverId?: string;
  feedbackOptions: OnboardingTemplateStepFeedbackOptionProps[];
}

export interface CreateOnboardingTemplateStepProps {
  position: number;
  name: string;
  description: string;
  type: OnboardingStepType;
  courseId?: string;
  recommendedStartOffsetDays: number;
  recommendedEndOffsetDays: number;
  coverId?: string;
  feedbackOptions: CreateOnboardingTemplateStepFeedbackOptionProps[];
}

export interface OnboardingTemplateStepFeedbackOptionProps {
  id: string;
  label: string;
}

export interface CreateOnboardingTemplateStepFeedbackOptionProps {
  label: string;
}
