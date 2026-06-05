import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CompleteOnboardingStepCommand } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command';
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import type { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';

@Injectable()
export class CompleteOnboardingStepHandler {
  constructor(
    @Inject(ONBOARDING_REPOSITORY)
    private readonly repository: OnboardingRepositoryPort,
  ) {}

  async execute(command: CompleteOnboardingStepCommand): Promise<void> {
    await this.repository.transaction(async () => {
      const found = await this.repository.findById(command.onboardingId);
      if (found.isNone()) {
        throw new NotFoundException('Onboarding not found');
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
