import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { OnboardingTemplateSummaryResponseDto } from '@/modules/onboarding/template/presentation/dto/template.response.dto';
import { ListOnboardingTemplatesQuery } from './list-templates.query';

@QueryHandler(ListOnboardingTemplatesQuery)
export class ListOnboardingTemplatesQueryHandler implements IQueryHandler<
  ListOnboardingTemplatesQuery,
  Paginated<OnboardingTemplateSummaryResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: ListOnboardingTemplatesQuery,
  ): Promise<Paginated<OnboardingTemplateSummaryResponseDto>> {
    const where = {
      ...(query.positionId ? { positionId: query.positionId } : {}),
      ...(query.divisionId ? { divisionId: query.divisionId } : {}),
    };

    const [count, rows] = await Promise.all([
      this.prismaService.client.onboardingTemplate.count({ where }),
      this.prismaService.client.onboardingTemplate.findMany({
        where,
        include: { _count: { select: { steps: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
    ]);

    return new Paginated({
      count,
      limit: query.limit,
      page: query.page,
      data: rows.map(
        (r) =>
          new OnboardingTemplateSummaryResponseDto({
            id: r.id,
            name: r.name,
            description: r.description,
            positionId: r.positionId ?? undefined,
            divisionId: r.divisionId,
            coverId: r.coverId,
            stepCount: r._count.steps,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          }),
      ),
    });
  }
}
