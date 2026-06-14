import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  OnboardingMapper,
  onboardingInclude,
} from '@/modules/onboarding/assignment/onboarding.mapper';
import { OnboardingResponseDto } from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';
import { ListMyOnboardingsQuery } from './list-my-onboardings.query';

@QueryHandler(ListMyOnboardingsQuery)
export class ListMyOnboardingsQueryHandler implements IQueryHandler<
  ListMyOnboardingsQuery,
  OnboardingResponseDto[]
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mapper: OnboardingMapper,
  ) {}

  async execute(
    _query: ListMyOnboardingsQuery,
  ): Promise<OnboardingResponseDto[]> {
    const userId = RequestContextService.getUserId()!;
    const rows = await this.prismaService.client.onboarding.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
      include: onboardingInclude,
    });
    return rows.map((r) => this.mapper.toResponse(r));
  }
}
