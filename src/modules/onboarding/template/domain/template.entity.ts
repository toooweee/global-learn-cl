import { randomUUID } from 'node:crypto';
import { AggregateId, Entity } from '@/libs/ddd/entity.base';
import {
  CreateOnboardingTemplateProps,
  OnboardingTemplateProps,
  OnboardingTemplateStepProps,
} from '@/modules/onboarding/template/template.types';

export class OnboardingTemplateEntity extends Entity<OnboardingTemplateProps> {
  private constructor(props: OnboardingTemplateProps, id: AggregateId) {
    super({ id, props });
  }

  static create(
    props: CreateOnboardingTemplateProps,
  ): OnboardingTemplateEntity {
    const steps: OnboardingTemplateStepProps[] = props.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((step) => {
        if (step.recommendedEndOffsetDays < step.recommendedStartOffsetDays) {
          throw new Error(
            `Template step "${step.name}": end offset must be >= start offset`,
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

    return new OnboardingTemplateEntity(
      {
        name: props.name,
        description: props.description,
        positionId: props.positionId,
        divisionId: props.divisionId,
        coverId: props.coverId,
        steps,
        createdAt: new Date(),
      },
      randomUUID(),
    );
  }

  static hydrate(
    props: OnboardingTemplateProps,
    id: AggregateId,
  ): OnboardingTemplateEntity {
    return new OnboardingTemplateEntity(props, id);
  }
}
