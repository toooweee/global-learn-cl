import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingEntity } from '@/modules/onboarding/assignment/domain/onboarding.entity';
import { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import {
  OnboardingMapper,
  onboardingInclude,
} from '@/modules/onboarding/assignment/onboarding.mapper';

@Injectable()
export class OnboardingPrismaRepository
  extends PrismaRepositoryBase
  implements OnboardingRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: OnboardingMapper,
  ) {
    super(prismaService);
  }

  async save(onboarding: OnboardingEntity): Promise<void> {
    const props = onboarding.getProps();
    const existing = await this.db.onboarding.findUnique({
      where: { id: onboarding.id },
      select: { id: true },
    });

    if (!existing) {
      await this.db.onboarding.create({
        data: {
          id: onboarding.id,
          name: props.name,
          description: props.description,
          templateId: props.templateId ?? null,
          assignedById: props.assignedById,
          assignedToId: props.assignedToId,
          status: props.status,
          startDate: props.startDate,
          endDate: props.endDate,
          completedAt: props.completedAt ?? null,
          createdAt: props.createdAt,
          steps: {
            create: props.steps.map((step) => ({
              id: step.id,
              position: step.position,
              name: step.name,
              description: step.description,
              type: step.type,
              courseId: step.courseId ?? null,
              recommendedStartDate: step.recommendedStartDate,
              recommendedEndDate: step.recommendedEndDate,
              feedbackText: step.feedbackText ?? null,
              completedAt: step.completedAt ?? null,
              feedbackOptions: {
                create: step.feedbackOptions.map((option) => ({
                  id: option.id,
                  label: option.label,
                })),
              },
              feedbackSelections: {
                create: step.selectedOptionIds.map((optionId) => ({
                  optionId,
                })),
              },
            })),
          },
        },
      });
      return;
    }

    await this.db.onboarding.update({
      where: { id: onboarding.id },
      data: {
        name: props.name,
        description: props.description,
        status: props.status,
        startDate: props.startDate,
        endDate: props.endDate,
        completedAt: props.completedAt ?? null,
      },
    });

    for (const step of props.steps) {
      await this.db.onboardingStep.update({
        where: { id: step.id },
        data: {
          feedbackText: step.feedbackText ?? null,
          completedAt: step.completedAt ?? null,
        },
      });

      await this.db.onboardingStepFeedbackSelection.deleteMany({
        where: { stepId: step.id },
      });
      if (step.selectedOptionIds.length > 0) {
        await this.db.onboardingStepFeedbackSelection.createMany({
          data: step.selectedOptionIds.map((optionId) => ({
            stepId: step.id,
            optionId,
          })),
        });
      }
    }
  }

  async findById(id: AggregateId): Promise<Option<OnboardingEntity>> {
    const row = await this.db.onboarding.findUnique({
      where: { id },
      include: onboardingInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async findByAssignee(assignedToId: AggregateId): Promise<OnboardingEntity[]> {
    const rows = await this.db.onboarding.findMany({
      where: { assignedToId },
      include: onboardingInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapper.toDomain(r));
  }
}
