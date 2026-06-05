import { randomUUID } from 'node:crypto';
import { OnboardingStatus, OnboardingStepType } from '@generated/client';
import { AggregateId, Entity } from '@/libs/ddd/entity.base';
import {
  OnboardingProps,
  OnboardingStepProps,
} from '@/modules/onboarding/assignment/onboarding.types';
import { OnboardingTemplateEntity } from '@/modules/onboarding/template/domain/template.entity';

export interface AssignFromTemplateProps {
  template: OnboardingTemplateEntity;
  assignedById: string;
  assignedToId: string;
  startDate: Date;
  endDate: Date;
  nameOverride?: string;
  descriptionOverride?: string;
}

export interface AssignAdHocProps {
  name: string;
  description: string;
  assignedById: string;
  assignedToId: string;
  startDate: Date;
  endDate: Date;
  steps: Array<{
    position: number;
    name: string;
    description: string;
    type: OnboardingStepType;
    courseId?: string;
    recommendedStartDate: Date;
    recommendedEndDate: Date;
    feedbackOptions: Array<{ label: string }>;
  }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class OnboardingEntity extends Entity<OnboardingProps> {
  protected readonly _id: AggregateId;

  private constructor(props: OnboardingProps, id: AggregateId) {
    super({ id, props });
  }

  static assignFromTemplate(props: AssignFromTemplateProps): OnboardingEntity {
    if (props.endDate <= props.startDate) {
      throw new Error('endDate must be after startDate');
    }
    const tpl = props.template.getProps();
    const steps: OnboardingStepProps[] = tpl.steps.map((step) => ({
      id: randomUUID(),
      position: step.position,
      name: step.name,
      description: step.description,
      type: step.type,
      courseId: step.courseId,
      recommendedStartDate: new Date(
        props.startDate.getTime() + step.recommendedStartOffsetDays * DAY_MS,
      ),
      recommendedEndDate: new Date(
        props.startDate.getTime() + step.recommendedEndOffsetDays * DAY_MS,
      ),
      feedbackOptions: step.feedbackOptions.map((option) => ({
        id: randomUUID(),
        label: option.label,
      })),
      selectedOptionIds: [],
    }));

    return new OnboardingEntity(
      {
        name: props.nameOverride ?? tpl.name,
        description: props.descriptionOverride ?? tpl.description,
        templateId: props.template.id,
        assignedById: props.assignedById,
        assignedToId: props.assignedToId,
        status: OnboardingStatus.IN_PROGRESS,
        startDate: props.startDate,
        endDate: props.endDate,
        steps,
        createdAt: new Date(),
      },
      randomUUID(),
    );
  }

  static assignAdHoc(props: AssignAdHocProps): OnboardingEntity {
    if (props.endDate <= props.startDate) {
      throw new Error('endDate must be after startDate');
    }
    const steps: OnboardingStepProps[] = props.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((step) => ({
        id: randomUUID(),
        position: step.position,
        name: step.name,
        description: step.description,
        type: step.type,
        courseId: step.courseId,
        recommendedStartDate: step.recommendedStartDate,
        recommendedEndDate: step.recommendedEndDate,
        feedbackOptions: step.feedbackOptions.map((option) => ({
          id: randomUUID(),
          label: option.label,
        })),
        selectedOptionIds: [],
      }));

    return new OnboardingEntity(
      {
        name: props.name,
        description: props.description,
        assignedById: props.assignedById,
        assignedToId: props.assignedToId,
        status: OnboardingStatus.IN_PROGRESS,
        startDate: props.startDate,
        endDate: props.endDate,
        steps,
        createdAt: new Date(),
      },
      randomUUID(),
    );
  }

  static hydrate(props: OnboardingProps, id: AggregateId): OnboardingEntity {
    return new OnboardingEntity(props, id);
  }

  currentStep(): OnboardingStepProps | undefined {
    return this._props.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .find((s) => !s.completedAt);
  }

  completeCurrentStep(input: {
    stepId: string;
    selectedOptionIds: string[];
    feedbackText?: string;
    now?: Date;
  }): void {
    if (this._props.status !== OnboardingStatus.IN_PROGRESS) {
      throw new Error('Onboarding is not in progress');
    }
    const current = this.currentStep();
    if (!current) {
      throw new Error('No remaining steps');
    }
    if (current.id !== input.stepId) {
      throw new Error('Cannot complete a step out of order');
    }

    const hasFeedback =
      (input.feedbackText && input.feedbackText.trim().length > 0) ||
      input.selectedOptionIds.length > 0;
    if (!hasFeedback) {
      throw new Error(
        'Step feedback is required (select at least one option or provide text)',
      );
    }

    const validIds = new Set(current.feedbackOptions.map((o) => o.id));
    for (const id of input.selectedOptionIds) {
      if (!validIds.has(id)) {
        throw new Error(`Unknown feedback option ${id}`);
      }
    }

    const now = input.now ?? new Date();
    current.completedAt = now;
    current.feedbackText = input.feedbackText;
    current.selectedOptionIds = Array.from(new Set(input.selectedOptionIds));

    const allDone = this._props.steps.every((s) => !!s.completedAt);
    if (allDone) {
      this._props.status = OnboardingStatus.COMPLETED;
      this._props.completedAt = now;
    }
    this._props.updatedAt = now;
  }

  cancel(now: Date = new Date()): void {
    if (this._props.status !== OnboardingStatus.IN_PROGRESS) return;
    this._props.status = OnboardingStatus.CANCELLED;
    this._props.updatedAt = now;
  }
}
