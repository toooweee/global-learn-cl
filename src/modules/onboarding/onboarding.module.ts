import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { NotificationModule } from '@/modules/notifications/notification.module';
import { MailModule } from '@/modules/mail/mail.module';
import { EmployeeModule } from '@/modules/employee/employee.module';
import { OnboardingInactivityService } from '@/modules/onboarding/assignment/application/onboarding-inactivity.service';

// Assignment
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { OnboardingPrismaRepository } from '@/modules/onboarding/assignment/infra/onboarding-prisma.repository';
import { OnboardingMapper } from '@/modules/onboarding/assignment/onboarding.mapper';
import { AssignOnboardingHandler } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command-handler';
import { CompleteOnboardingStepHandler } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command-handler';
import { CancelOnboardingCommandHandler } from '@/modules/onboarding/assignment/application/commands/cancel-onboarding/cancel-onboarding.command-handler';
import { GetOnboardingQueryHandler } from '@/modules/onboarding/assignment/application/queries/get-onboarding/get-onboarding.query-handler';
import { ListMyOnboardingsQueryHandler } from '@/modules/onboarding/assignment/application/queries/list-my-onboardings/list-my-onboardings.query-handler';
import { ListAssignedByMeQueryHandler } from '@/modules/onboarding/assignment/application/queries/list-assigned-by-me/list-assigned-by-me.query-handler';
import { ListOnboardingsQueryHandler } from '@/modules/onboarding/assignment/application/queries/list-onboardings/list-onboardings.query-handler';
import { OnboardingController } from '@/modules/onboarding/assignment/presentation/onboarding.controller';

// Template
import { ONBOARDING_TEMPLATE_REPOSITORY } from '@/modules/onboarding/template/application/ports/template.repository.port';
import { OnboardingTemplatePrismaRepository } from '@/modules/onboarding/template/infra/template-prisma.repository';
import { OnboardingTemplateMapper } from '@/modules/onboarding/template/template.mapper';
import { CreateOnboardingTemplateHandler } from '@/modules/onboarding/template/application/create-template/create-template.command-handler';
import { UpdateOnboardingTemplateCommandHandler } from '@/modules/onboarding/template/application/commands/update-template/update-template.command-handler';
import { GetOnboardingTemplateQueryHandler } from '@/modules/onboarding/template/application/queries/get-template/get-template.query-handler';
import { ListOnboardingTemplatesQueryHandler } from '@/modules/onboarding/template/application/queries/list-templates/list-templates.query-handler';
import { OnboardingTemplateController } from '@/modules/onboarding/template/presentation/template.controller';

// Chat
import { ONBOARDING_CHAT_REPOSITORY } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import { OnboardingChatPrismaRepository } from '@/modules/onboarding/chat/infra/chat-prisma.repository';
import { OnboardingChatMapper } from '@/modules/onboarding/chat/chat.mapper';
import { SendOnboardingChatMessageHandler } from '@/modules/onboarding/chat/application/send-message/send-message.command-handler';
import { MarkChatMessagesReadCommandHandler } from '@/modules/onboarding/chat/application/commands/mark-messages-read/mark-messages-read.command-handler';
import { ListChatMessagesQueryHandler } from '@/modules/onboarding/chat/application/queries/list-messages/list-messages.query-handler';
import { OnboardingChatController } from '@/modules/onboarding/chat/presentation/chat.controller';

const repositories: Provider[] = [
  {
    provide: ONBOARDING_TEMPLATE_REPOSITORY,
    useClass: OnboardingTemplatePrismaRepository,
  },
  { provide: ONBOARDING_REPOSITORY, useClass: OnboardingPrismaRepository },
  {
    provide: ONBOARDING_CHAT_REPOSITORY,
    useClass: OnboardingChatPrismaRepository,
  },
];

const mappers: Provider[] = [
  OnboardingTemplateMapper,
  OnboardingMapper,
  OnboardingChatMapper,
];

const services: Provider[] = [OnboardingInactivityService];

const commandHandlers: Provider[] = [
  CreateOnboardingTemplateHandler,
  UpdateOnboardingTemplateCommandHandler,
  AssignOnboardingHandler,
  CompleteOnboardingStepHandler,
  CancelOnboardingCommandHandler,
  SendOnboardingChatMessageHandler,
  MarkChatMessagesReadCommandHandler,
];

const queryHandlers: Provider[] = [
  GetOnboardingTemplateQueryHandler,
  ListOnboardingTemplatesQueryHandler,
  GetOnboardingQueryHandler,
  ListMyOnboardingsQueryHandler,
  ListAssignedByMeQueryHandler,
  ListOnboardingsQueryHandler,
  ListChatMessagesQueryHandler,
];

@Module({
  imports: [PrismaModule, NotificationModule, MailModule, EmployeeModule],
  controllers: [
    OnboardingTemplateController,
    OnboardingController,
    OnboardingChatController,
  ],
  providers: [
    ...repositories,
    ...mappers,
    ...commandHandlers,
    ...queryHandlers,
    ...services,
  ],
})
export class OnboardingModule {}
