import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingTemplateEntity } from '@/modules/onboarding/template/domain/template.entity';
import { OnboardingTemplateRepositoryPort } from '@/modules/onboarding/template/application/ports/template.repository.port';
import {
  OnboardingTemplateMapper,
  onboardingTemplateInclude,
} from '@/modules/onboarding/template/template.mapper';

@Injectable()
export class OnboardingTemplatePrismaRepository
  extends PrismaRepositoryBase
  implements OnboardingTemplateRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: OnboardingTemplateMapper,
  ) {
    super(prismaService);
  }

  async save(template: OnboardingTemplateEntity): Promise<void> {
    const props = template.getProps();

    const stepCreate = props.steps.map((step) => ({
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
    }));

    await this.db.onboardingTemplate.upsert({
      where: { id: template.id },
      update: {
        name: props.name,
        description: props.description,
        coverId: props.coverId ?? null,
        updatedAt: props.updatedAt ?? new Date(),
        steps: {
          deleteMany: {},
          create: stepCreate,
        },
      },
      create: {
        id: template.id,
        name: props.name,
        description: props.description,
        positionId: props.positionId,
        divisionId: props.divisionId,
        coverId: props.coverId ?? null,
        createdAt: props.createdAt,
        steps: { create: stepCreate },
      },
    });
  }

  async findById(id: AggregateId): Promise<Option<OnboardingTemplateEntity>> {
    const row = await this.db.onboardingTemplate.findUnique({
      where: { id },
      include: onboardingTemplateInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async findForRole(
    positionId: AggregateId,
    divisionId: AggregateId,
  ): Promise<Option<OnboardingTemplateEntity>> {
    const row = await this.db.onboardingTemplate.findFirst({
      where: { positionId, divisionId },
      include: onboardingTemplateInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }
}
