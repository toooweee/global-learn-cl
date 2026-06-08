import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { onboardingInclude } from '@/modules/onboarding/assignment/onboarding.mapper';
import {
  OnboardingResponseDto,
  OnboardingStepResponseDto,
} from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';
import { GetOnboardingQuery } from './get-onboarding.query';

@QueryHandler(GetOnboardingQuery)
export class GetOnboardingQueryHandler implements IQueryHandler<
  GetOnboardingQuery,
  OnboardingResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetOnboardingQuery): Promise<OnboardingResponseDto> {
    const row = await this.prismaService.client.onboarding.findUnique({
      where: { id: query.onboardingId },
      include: onboardingInclude,
    });
    if (!row) {
      throw new ApplicationException(
        'Onboarding not found',
        404,
        'ONBOARDING_NOT_FOUND',
      );
    }

    const steps: ConstructorParameters<typeof OnboardingStepResponseDto>[0][] =
      row.steps.map((s) => ({
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
      }));

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
      steps,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? undefined,
    });
  }
}
