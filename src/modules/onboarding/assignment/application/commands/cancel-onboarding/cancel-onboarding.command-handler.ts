import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import {
  COURSE_ASSIGNER_ROLES,
  type AppRole,
} from '@/libs/auth/roles.constants';
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

    // Only the assignee, the manager who assigned it, or a manager may cancel.
    const props = onboarding.getProps();
    const userId = RequestContextService.getUserId();
    const role = RequestContextService.getUserRole() as AppRole | undefined;
    const isManager = !!role && COURSE_ASSIGNER_ROLES.includes(role);
    const isParticipant =
      props.assignedById === userId || props.assignedToId === userId;
    if (!isParticipant && !isManager) {
      throw new ApplicationException(
        'You cannot cancel this onboarding',
        403,
        'FORBIDDEN',
      );
    }

    onboarding.cancel();
    await this.repository.save(onboarding);
  }
}
