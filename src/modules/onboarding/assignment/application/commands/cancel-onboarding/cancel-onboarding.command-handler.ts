import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import type { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { CancelOnboardingCommand } from './cancel-onboarding.command';

@CommandHandler(CancelOnboardingCommand)
export class CancelOnboardingCommandHandler implements ICommandHandler<
  CancelOnboardingCommand,
  void
> {
  constructor(
    @Inject(ONBOARDING_REPOSITORY)
    private readonly repository: OnboardingRepositoryPort,
  ) {}

  async execute(command: CancelOnboardingCommand): Promise<void> {
    const option = await this.repository.findById(command.onboardingId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Onboarding not found',
        404,
        'ONBOARDING_NOT_FOUND',
      );
    }
    const onboarding = option.unwrap();
    onboarding.cancel();
    await this.repository.save(onboarding);
  }
}
