import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OnboardingStatus } from '@generated/client';
import { CompleteOnboardingStepCommand } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command';
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import type { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { NotificationService } from '@/modules/notifications/notification.service';
import { MailService } from '@/modules/mail/mail.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

@CommandHandler(CompleteOnboardingStepCommand)
export class CompleteOnboardingStepHandler implements ICommandHandler<
  CompleteOnboardingStepCommand,
  void
> {
  constructor(
    @Inject(ONBOARDING_REPOSITORY)
    private readonly repository: OnboardingRepositoryPort,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: CompleteOnboardingStepCommand): Promise<void> {
    let completed: {
      assignedToId: string;
      assignedById: string;
      name: string;
    } | null = null;

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

      const props = onboarding.getProps();
      if (props.status === OnboardingStatus.COMPLETED) {
        completed = {
          assignedToId: props.assignedToId,
          assignedById: props.assignedById,
          name: props.name,
        };
      }
    });

    if (completed) {
      const { assignedToId, assignedById, name } = completed as {
        assignedToId: string;
        assignedById: string;
        name: string;
      };
      const onboardingId = command.onboardingId;

      this.notificationService
        .notify(assignedToId, 'ONBOARDING_COMPLETED', { onboardingId })
        .catch(() => undefined);

      this.notificationService
        .notify(assignedById, 'ONBOARDING_COMPLETED_MANAGER', { onboardingId })
        .catch(() => undefined);

      this.prismaService.client.user
        .findUnique({ where: { id: assignedToId }, select: { email: true } })
        .then((user) => {
          if (user?.email) {
            return this.mailService.sendOnboardingCompleted(user.email, {
              onboardingName: name,
            });
          }
        })
        .catch(() => undefined);
    }
  }
}
