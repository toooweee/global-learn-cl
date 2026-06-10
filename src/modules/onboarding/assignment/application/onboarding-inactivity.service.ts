import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnboardingStatus } from '@generated/client';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { NotificationService } from '@/modules/notifications/notification.service';

@Injectable()
export class OnboardingInactivityService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // Runs daily at 9:00 AM. Finds onboarding steps whose recommended deadline
  // passed yesterday and are still incomplete — fires a reminder once per step.
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyOverdueSteps(): Promise<void> {
    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const overdueSteps =
      await this.prismaService.client.onboardingStep.findMany({
        where: {
          completedAt: null,
          recommendedEndDate: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
          onboarding: { status: OnboardingStatus.IN_PROGRESS },
        },
        select: {
          id: true,
          name: true,
          onboarding: {
            select: { id: true, assignedToId: true, assignedById: true },
          },
        },
      });

    for (const step of overdueSteps) {
      const { assignedToId, assignedById, id: onboardingId } = step.onboarding;

      this.notificationService
        .notify(assignedToId, 'ONBOARDING_STEP_OVERDUE', {
          onboardingId,
          stepName: step.name,
        })
        .catch(() => undefined);

      if (assignedById !== assignedToId) {
        this.notificationService
          .notify(assignedById, 'ONBOARDING_STEP_OVERDUE_MANAGER', {
            onboardingId,
            stepName: step.name,
            assignedToId,
          })
          .catch(() => undefined);
      }
    }
  }
}
