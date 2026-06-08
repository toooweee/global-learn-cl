import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { OnboardingSummaryResponseDto } from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';
import { ListMyOnboardingsQuery } from './list-my-onboardings.query';

@QueryHandler(ListMyOnboardingsQuery)
export class ListMyOnboardingsQueryHandler implements IQueryHandler<
  ListMyOnboardingsQuery,
  OnboardingSummaryResponseDto[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    _query: ListMyOnboardingsQuery,
  ): Promise<OnboardingSummaryResponseDto[]> {
    const userId = RequestContextService.getUserId()!;
    const rows = await this.prismaService.client.onboarding.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => new OnboardingSummaryResponseDto(r));
  }
}
