import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  OnboardingMapper,
  onboardingInclude,
} from '@/modules/onboarding/assignment/onboarding.mapper';
import { OnboardingResponseDto } from '@/modules/onboarding/assignment/presentation/dto/onboarding.response.dto';
import { GetOnboardingQuery } from './get-onboarding.query';

@QueryHandler(GetOnboardingQuery)
export class GetOnboardingQueryHandler implements IQueryHandler<
  GetOnboardingQuery,
  OnboardingResponseDto
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mapper: OnboardingMapper,
  ) {}

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

    return this.mapper.toResponse(row);
  }
}
