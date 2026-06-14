import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { OnboardingEntity } from '@/modules/onboarding/assignment/domain/onboarding.entity';
import { OnboardingResponseDto } from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';

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

  toResponse(row: OnboardingRecord): OnboardingResponseDto {
    return new OnboardingResponseDto({
      id: row.id,
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
      steps: row.steps.map((s) => ({
        id: s.id,
        position: s.position,
        name: s.name,
        description: s.description,
        type: s.type,
        courseId: s.courseId ?? undefined,
        recommendedStartDate: s.recommendedStartDate,
        recommendedEndDate: s.recommendedEndDate,
        feedbackText: s.feedbackText ?? undefined,
        completedAt: s.completedAt ?? undefined,
        feedbackOptions: s.feedbackOptions.map((o) => ({
          id: o.id,
          label: o.label,
        })),
        selectedOptionIds: s.feedbackSelections.map((sel) => sel.optionId),
      })),
    });
  }
}
