import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { OnboardingStatus, OnboardingStepType } from '@generated/client';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingEntity } from '@/modules/onboarding/assignment/domain/onboarding.entity';
import { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';

type PrismaOnboarding = {
  id: string;
  name: string;
  description: string;
  templateId: string | null;
  assignedById: string;
  assignedToId: string;
  status: OnboardingStatus;
  startDate: Date;
  endDate: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  steps: Array<{
    id: string;
    position: number;
    name: string;
    description: string;
    type: OnboardingStepType;
    courseId: string | null;
    recommendedStartDate: Date;
    recommendedEndDate: Date;
    feedbackText: string | null;
    completedAt: Date | null;
    feedbackOptions: Array<{ id: string; label: string }>;
    feedbackSelections: Array<{ optionId: string }>;
  }>;
};

@Injectable()
export class OnboardingPrismaRepository
  extends PrismaRepositoryBase
  implements OnboardingRepositoryPort
{
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
      include: this.fullInclude(),
    });
    return row ? Some(this.toDomain(row as PrismaOnboarding)) : None;
  }

  async findByAssignee(assignedToId: AggregateId): Promise<OnboardingEntity[]> {
    const rows = await this.db.onboarding.findMany({
      where: { assignedToId },
      include: this.fullInclude(),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r as PrismaOnboarding));
  }

  private fullInclude() {
    return {
      steps: {
        orderBy: { position: 'asc' as const },
        include: {
          feedbackOptions: true,
          feedbackSelections: true,
        },
      },
    };
  }

  private toDomain(row: PrismaOnboarding): OnboardingEntity {
    return OnboardingEntity.hydrate(
      {
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
      row.id,
    );
  }
}
