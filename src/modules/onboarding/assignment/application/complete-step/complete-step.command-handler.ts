import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CompleteOnboardingStepCommand } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command';
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import type { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CompleteOnboardingStepCommand)
export class CompleteOnboardingStepHandler implements ICommandHandler<
  CompleteOnboardingStepCommand,
  void
> {
  constructor(
    @Inject(ONBOARDING_REPOSITORY)
    private readonly repository: OnboardingRepositoryPort,
  ) {}

  async execute(command: CompleteOnboardingStepCommand): Promise<void> {
    await this.repository.transaction(async () => {
      const found = await this.repository.findById(command.onboardingId);
      if (found.isNone()) {
        throw new ApplicationException(
          'Onboarding not found',
          404,
          'ONBOARDING_NOT_FOUND',
        );
      }
      const onboarding = found.unwrap();
      onboarding.completeCurrentStep({
        stepId: command.stepId,
        selectedOptionIds: command.selectedOptionIds,
        feedbackText: command.feedbackText,
      });
      await this.repository.save(onboarding);
    });
  }
}
