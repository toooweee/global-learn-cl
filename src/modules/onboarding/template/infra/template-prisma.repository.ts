import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingTemplateEntity } from '@/modules/onboarding/template/domain/template.entity';
import { OnboardingTemplateRepositoryPort } from '@/modules/onboarding/template/application/ports/template.repository.port';
import { OnboardingTemplateProps } from '@/modules/onboarding/template/template.types';

type PrismaTemplate = {
  id: string;
  name: string;
  description: string;
  positionId: string;
  divisionId: string;
  coverId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  steps: Array<{
    id: string;
    position: number;
    name: string;
    description: string;
    type: OnboardingTemplateProps['steps'][number]['type'];
    courseId: string | null;
    recommendedStartOffsetDays: number;
    recommendedEndOffsetDays: number;
    coverId: string | null;
    feedbackOptions: Array<{ id: string; label: string }>;
  }>;
};

@Injectable()
export class OnboardingTemplatePrismaRepository
  extends PrismaRepositoryBase
  implements OnboardingTemplateRepositoryPort
{
  async save(template: OnboardingTemplateEntity): Promise<void> {
    const props = template.getProps();

    await this.db.onboardingTemplate.upsert({
      where: { id: template.id },
      update: {
        name: props.name,
        description: props.description,
        coverId: props.coverId ?? null,
      },
      create: {
        id: template.id,
        name: props.name,
        description: props.description,
        positionId: props.positionId,
        divisionId: props.divisionId,
        coverId: props.coverId ?? null,
        createdAt: props.createdAt,
        steps: {
          create: props.steps.map((step) => ({
            id: step.id,
            position: step.position,
            name: step.name,
            description: step.description,
            type: step.type,
            courseId: step.courseId ?? null,
            recommendedStartOffsetDays: step.recommendedStartOffsetDays,
            recommendedEndOffsetDays: step.recommendedEndOffsetDays,
            coverId: step.coverId ?? null,
            feedbackOptions: {
              create: step.feedbackOptions.map((option) => ({
                id: option.id,
                label: option.label,
              })),
            },
          })),
        },
      },
    });
  }

  async findById(id: AggregateId): Promise<Option<OnboardingTemplateEntity>> {
    const row = await this.db.onboardingTemplate.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { position: 'asc' },
          include: { feedbackOptions: true },
        },
      },
    });
    return row ? Some(this.toDomain(row as PrismaTemplate)) : None;
  }

  async findForRole(
    positionId: AggregateId,
    divisionId: AggregateId,
  ): Promise<Option<OnboardingTemplateEntity>> {
    const row = await this.db.onboardingTemplate.findUnique({
      where: { positionId_divisionId: { positionId, divisionId } },
      include: {
        steps: {
          orderBy: { position: 'asc' },
          include: { feedbackOptions: true },
        },
      },
    });
    return row ? Some(this.toDomain(row as PrismaTemplate)) : None;
  }

  private toDomain(row: PrismaTemplate): OnboardingTemplateEntity {
    return OnboardingTemplateEntity.hydrate(
      {
        name: row.name,
        description: row.description,
        positionId: row.positionId,
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
      row.id,
    );
  }
}
