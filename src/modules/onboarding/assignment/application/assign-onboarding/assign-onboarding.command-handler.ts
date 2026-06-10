import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OnboardingEntity } from '@/modules/onboarding/assignment/domain/onboarding.entity';
import { AssignOnboardingCommand } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command';
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import type { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { ONBOARDING_TEMPLATE_REPOSITORY } from '@/modules/onboarding/template/application/ports/template.repository.port';
import type { OnboardingTemplateRepositoryPort } from '@/modules/onboarding/template/application/ports/template.repository.port';
import { ONBOARDING_CHAT_REPOSITORY } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import type { OnboardingChatRepositoryPort } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import { OnboardingChatEntity } from '@/modules/onboarding/chat/domain/chat.entity';
import { IdResponseDto } from '@/libs/api/dto';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { NotificationService } from '@/modules/notifications/notification.service';
import { MailService } from '@/modules/mail/mail.service';
import { SubordinateCheckService } from '@/modules/employee/application/subordinate-check.service';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { MANAGERIAL_ROLES } from '@/libs/auth/roles.constants';

@CommandHandler(AssignOnboardingCommand)
export class AssignOnboardingHandler implements ICommandHandler<
  AssignOnboardingCommand,
  IdResponseDto
> {
  constructor(
    @Inject(ONBOARDING_REPOSITORY)
    private readonly repository: OnboardingRepositoryPort,
    @Inject(ONBOARDING_TEMPLATE_REPOSITORY)
    private readonly templateRepository: OnboardingTemplateRepositoryPort,
    @Inject(ONBOARDING_CHAT_REPOSITORY)
    private readonly chatRepository: OnboardingChatRepositoryPort,
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly subordinateCheck: SubordinateCheckService,
  ) {}

  async execute(command: AssignOnboardingCommand): Promise<IdResponseDto> {
    const actorRole = RequestContextService.getUserRole();
    if (MANAGERIAL_ROLES.includes(actorRole as never)) {
      const ok = await this.subordinateCheck.isSubordinate(
        command.assignedById,
        command.assignedToId,
      );
      if (!ok) {
        throw new ApplicationException(
          'You can only assign onboarding to your direct or indirect subordinates',
          403,
          'ONBOARDING_NOT_YOUR_SUBORDINATE',
        );
      }
    }

    const onboardingId = await this.repository.transaction(async () => {
      const template = await this.templateRepository.findById(
        command.templateId,
      );
      if (template.isNone()) {
        throw new ApplicationException(
          'Onboarding template not found',
          404,
          'ONBOARDING_TEMPLATE_NOT_FOUND',
        );
      }

      const onboarding = OnboardingEntity.assignFromTemplate({
        template: template.unwrap(),
        assignedById: command.assignedById,
        assignedToId: command.assignedToId,
        startDate: command.startDate,
        endDate: command.endDate,
        nameOverride: command.nameOverride,
        descriptionOverride: command.descriptionOverride,
      });

      await this.repository.save(onboarding);
      await this.chatRepository.save(
        OnboardingChatEntity.create(onboarding.id),
      );

      return onboarding.id;
    });

    // employeeId === userId in this schema (shared PK)
    const userId = command.assignedToId;

    this.notificationService
      .notify(userId, 'ONBOARDING_ASSIGNED', { onboardingId })
      .catch(() => undefined);

    this.prismaService.client.user
      .findUnique({ where: { id: userId }, select: { email: true } })
      .then((user) => {
        if (user?.email) {
          return this.mailService.sendOnboardingAssigned(user.email, {
            startDate: command.startDate.toISOString().slice(0, 10),
            endDate: command.endDate.toISOString().slice(0, 10),
          });
        }
      })
      .catch(() => undefined);

    return new IdResponseDto(onboardingId);
  }
}
