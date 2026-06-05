import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OnboardingEntity } from '@/modules/onboarding/assignment/domain/onboarding.entity';
import { AssignOnboardingCommand } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command';
import { ONBOARDING_REPOSITORY } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import type { OnboardingRepositoryPort } from '@/modules/onboarding/assignment/application/ports/onboarding.repository.port';
import { ONBOARDING_TEMPLATE_REPOSITORY } from '@/modules/onboarding/template/application/ports/template.repository.port';
import type { OnboardingTemplateRepositoryPort } from '@/modules/onboarding/template/application/ports/template.repository.port';
import { ONBOARDING_CHAT_REPOSITORY } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import type { OnboardingChatRepositoryPort } from '@/modules/onboarding/chat/application/ports/chat.repository.port';
import { OnboardingChatEntity } from '@/modules/onboarding/chat/domain/chat.entity';

@Injectable()
export class AssignOnboardingHandler {
  constructor(
    @Inject(ONBOARDING_REPOSITORY)
    private readonly repository: OnboardingRepositoryPort,
    @Inject(ONBOARDING_TEMPLATE_REPOSITORY)
    private readonly templateRepository: OnboardingTemplateRepositoryPort,
    @Inject(ONBOARDING_CHAT_REPOSITORY)
    private readonly chatRepository: OnboardingChatRepositoryPort,
  ) {}

  async execute(command: AssignOnboardingCommand): Promise<{ id: string }> {
    return this.repository.transaction(async () => {
      const template = await this.templateRepository.findById(
        command.templateId,
      );
      if (template.isNone()) {
        throw new NotFoundException('Onboarding template not found');
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

      return { id: onboarding.id };
    });
  }
}
