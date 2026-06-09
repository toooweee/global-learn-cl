import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { OnboardingTemplateEntity } from '@/modules/onboarding/template/domain/template.entity';

export const onboardingTemplateInclude = {
  steps: {
    orderBy: { position: 'asc' },
    include: { feedbackOptions: true },
  },
} satisfies Prisma.OnboardingTemplateInclude;

export type OnboardingTemplateRecord = Prisma.OnboardingTemplateGetPayload<{
  include: typeof onboardingTemplateInclude;
}>;

@Injectable()
export class OnboardingTemplateMapper implements ToDomain<
  OnboardingTemplateRecord,
  OnboardingTemplateEntity
> {
  toDomain(row: OnboardingTemplateRecord): OnboardingTemplateEntity {
    return OnboardingTemplateEntity.recreate({
      id: row.id,
      props: {
        name: row.name,
        description: row.description,
        positionId: row.positionId ?? undefined,
        divisionId: row.divisionId,
        coverId: row.coverId ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt ?? undefined,
        steps: row.steps.map((step) => ({
          id: step.id,
          position: step.position,
          name: step.name,
          description: step.description,
          type: step.type,
          courseId: step.courseId ?? undefined,
          recommendedStartOffsetDays: step.recommendedStartOffsetDays,
          recommendedEndOffsetDays: step.recommendedEndOffsetDays,
          coverId: step.coverId ?? undefined,
          feedbackOptions: step.feedbackOptions.map((option) => ({
            id: option.id,
            label: option.label,
          })),
        })),
      },
    });
  }
}
