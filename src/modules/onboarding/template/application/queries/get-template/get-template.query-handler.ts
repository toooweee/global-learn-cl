import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { onboardingTemplateInclude } from '@/modules/onboarding/template/template.mapper';
import { OnboardingTemplateResponseDto } from '@/modules/onboarding/template/presentation/dto/template.response.dto';
import { GetOnboardingTemplateQuery } from './get-template.query';

@QueryHandler(GetOnboardingTemplateQuery)
export class GetOnboardingTemplateQueryHandler implements IQueryHandler<
  GetOnboardingTemplateQuery,
  OnboardingTemplateResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: GetOnboardingTemplateQuery,
  ): Promise<OnboardingTemplateResponseDto> {
    const row = await this.prismaService.client.onboardingTemplate.findUnique({
      where: { id: query.templateId },
      include: onboardingTemplateInclude,
    });
    if (!row) {
      throw new ApplicationException(
        'Onboarding template not found',
        404,
        'ONBOARDING_TEMPLATE_NOT_FOUND',
      );
    }

    return new OnboardingTemplateResponseDto({
      id: row.id,
      name: row.name,
      description: row.description,
      positionId: row.positionId,
      divisionId: row.divisionId,
      coverId: row.coverId,
      steps: row.steps.map((s) => ({
        id: s.id,
        position: s.position,
        name: s.name,
        description: s.description,
        type: s.type,
        courseId: s.courseId,
        recommendedStartOffsetDays: s.recommendedStartOffsetDays,
        recommendedEndOffsetDays: s.recommendedEndOffsetDays,
        coverId: s.coverId,
        feedbackOptions: s.feedbackOptions.map((o) => ({
          id: o.id,
          label: o.label,
        })),
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
