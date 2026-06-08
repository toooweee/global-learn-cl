import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OnboardingStatus } from '@generated/client';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { OnboardingSummaryResponseDto } from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';
import { ListOnboardingsQuery } from './list-onboardings.query';

@QueryHandler(ListOnboardingsQuery)
export class ListOnboardingsQueryHandler implements IQueryHandler<
  ListOnboardingsQuery,
  Paginated<OnboardingSummaryResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: ListOnboardingsQuery,
  ): Promise<Paginated<OnboardingSummaryResponseDto>> {
    const where: {
      assignedToId?: string;
      assignedById?: string;
      status?: OnboardingStatus;
    } = {};
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.assignedById) where.assignedById = query.assignedById;
    if (query.status) where.status = query.status;

    const [count, rows] = await Promise.all([
      this.prismaService.client.onboarding.count({ where }),
      this.prismaService.client.onboarding.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new Paginated({
      count,
      limit: query.limit,
      page: query.page,
      data: rows.map((r) => new OnboardingSummaryResponseDto(r)),
    });
  }
}
