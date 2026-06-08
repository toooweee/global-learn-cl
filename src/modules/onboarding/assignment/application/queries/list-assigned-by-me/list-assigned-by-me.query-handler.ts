import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { OnboardingSummaryResponseDto } from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';
import { ListAssignedByMeQuery } from './list-assigned-by-me.query';

@QueryHandler(ListAssignedByMeQuery)
export class ListAssignedByMeQueryHandler implements IQueryHandler<
  ListAssignedByMeQuery,
  OnboardingSummaryResponseDto[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    _query: ListAssignedByMeQuery,
  ): Promise<OnboardingSummaryResponseDto[]> {
    const userId = RequestContextService.getUserId()!;
    const rows = await this.prismaService.client.onboarding.findMany({
      where: { assignedById: userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => new OnboardingSummaryResponseDto(r));
  }
}
