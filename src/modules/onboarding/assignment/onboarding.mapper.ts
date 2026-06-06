import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { OnboardingEntity } from '@/modules/onboarding/assignment/domain/onboarding.entity';

export const onboardingInclude = {
  steps: {
    orderBy: { position: 'asc' },
    include: {
      feedbackOptions: true,
      feedbackSelections: true,
    },
  },
} satisfies Prisma.OnboardingInclude;

export type OnboardingRecord = Prisma.OnboardingGetPayload<{
  include: typeof onboardingInclude;
}>;

@Injectable()
export class OnboardingMapper implements ToDomain<
  OnboardingRecord,
  OnboardingEntity
> {
  toDomain(row: OnboardingRecord): OnboardingEntity {
    return OnboardingEntity.recreate({
      id: row.id,
      props: {
        name: row.name,
        description: row.description,
        templateId: row.templateId ?? undefined,
        assignedById: row.assignedById,
        assignedToId: row.assignedToId,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        completedAt: row.completedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt ?? undefined,
        steps: row.steps.map((step) => ({
          id: step.id,
          position: step.position,
          name: step.name,
          description: step.description,
          type: step.type,
          courseId: step.courseId ?? undefined,
          recommendedStartDate: step.recommendedStartDate,
          recommendedEndDate: step.recommendedEndDate,
          feedbackText: step.feedbackText ?? undefined,
          completedAt: step.completedAt ?? undefined,
          feedbackOptions: step.feedbackOptions.map((option) => ({
            id: option.id,
            label: option.label,
          })),
          selectedOptionIds: step.feedbackSelections.map((s) => s.optionId),
        })),
      },
    });
  }
}
