import { randomUUID } from 'node:crypto';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import { DomainException } from '@/libs/ddd/domain.exception';
import {
  CreateOnboardingTemplateProps,
  OnboardingTemplateProps,
  OnboardingTemplateStepProps,
} from '@/modules/onboarding/template/template.types';

export interface RecreateOnboardingTemplateProps {
  id: AggregateId;
  props: OnboardingTemplateProps;
}

export class OnboardingTemplateEntity extends Entity<OnboardingTemplateProps> {
  protected constructor(props: CreateEntityProps<OnboardingTemplateProps>) {
    super(props);
  }

  static create(
    props: CreateOnboardingTemplateProps,
  ): OnboardingTemplateEntity {
    const steps: OnboardingTemplateStepProps[] = props.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((step) => {
        if (step.recommendedEndOffsetDays < step.recommendedStartOffsetDays) {
          throw new DomainException(
            `Template step "${step.name}": end offset must be >= start offset`,
            'ONBOARDING_TEMPLATE_STEP_INVALID_OFFSETS',
          );
        }
        return {
          id: randomUUID(),
          position: step.position,
          name: step.name,
          description: step.description,
          type: step.type,
          courseId: step.courseId,
          recommendedStartOffsetDays: step.recommendedStartOffsetDays,
          recommendedEndOffsetDays: step.recommendedEndOffsetDays,
          coverId: step.coverId,
          feedbackOptions: step.feedbackOptions.map((option) => ({
            id: randomUUID(),
            label: option.label,
          })),
        };
      });

    return new OnboardingTemplateEntity({
      id: randomUUID(),
      props: {
        name: props.name,
        description: props.description,
        positionId: props.positionId,
        divisionId: props.divisionId,
        coverId: props.coverId,
        steps,
        createdAt: new Date(),
      },
    });
  }

  static recreate({
    id,
    props,
  }: RecreateOnboardingTemplateProps): OnboardingTemplateEntity {
    return new OnboardingTemplateEntity({ id, props });
  }
}
