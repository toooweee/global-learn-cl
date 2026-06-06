import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';

import { ONBOARDING_TEMPLATE_REPOSITORY } from '@/modules/onboarding/template/application/ports/template.repository.port';
import { OnboardingTemplatePrismaRepository } from '@/modules/onboarding/template/infra/template-prisma.repository';
import { OnboardingTemplateMapper } from '@/modules/onboarding/template/template.mapper';
import { CreateOnboardingTemplateHandler } from '@/modules/onboarding/template/application/create-template/create-template.command-handler';
import { OnboardingTemplateController } from '@/modules/onboarding/template/presentation/template.controller';

import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { OnboardingPrismaRepository } from '@/modules/onboarding/assignment/infra/onboarding-prisma.repository';
import { OnboardingMapper } from '@/modules/onboarding/assignment/onboarding.mapper';
import { AssignOnboardingHandler } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command-handler';
import { CompleteOnboardingStepHandler } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command-handler';
import { OnboardingController } from '@/modules/onboarding/assignment/presentation/onboarding.controller';

import { ONBOARDING_CHAT_REPOSITORY } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import { OnboardingChatPrismaRepository } from '@/modules/onboarding/chat/infra/chat-prisma.repository';
import { OnboardingChatMapper } from '@/modules/onboarding/chat/chat.mapper';
import { SendOnboardingChatMessageHandler } from '@/modules/onboarding/chat/application/send-message/send-message.command-handler';
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

const commandHandlers: Provider[] = [
  CreateOnboardingTemplateHandler,
  AssignOnboardingHandler,
  CompleteOnboardingStepHandler,
  SendOnboardingChatMessageHandler,
];

@Module({
  imports: [PrismaModule],
  controllers: [
    OnboardingTemplateController,
    OnboardingController,
    OnboardingChatController,
  ],
  providers: [...repositories, ...mappers, ...commandHandlers],
})
export class OnboardingModule {}
