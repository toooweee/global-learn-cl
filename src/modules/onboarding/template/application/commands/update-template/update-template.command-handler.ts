import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { ONBOARDING_TEMPLATE_REPOSITORY } from '@/modules/onboarding/template/application/ports/template.repository.port';
import type { OnboardingTemplateRepositoryPort } from '@/modules/onboarding/template/application/ports/template.repository.port';
import { UpdateOnboardingTemplateCommand } from './update-template.command';

@CommandHandler(UpdateOnboardingTemplateCommand)
export class UpdateOnboardingTemplateCommandHandler implements ICommandHandler<
  UpdateOnboardingTemplateCommand,
  void
> {
  constructor(
    @Inject(ONBOARDING_TEMPLATE_REPOSITORY)
    private readonly repository: OnboardingTemplateRepositoryPort,
  ) {}

  async execute(command: UpdateOnboardingTemplateCommand): Promise<void> {
    const option = await this.repository.findById(command.templateId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Onboarding template not found',
        404,
        'ONBOARDING_TEMPLATE_NOT_FOUND',
      );
    }
    const template = option.unwrap();
    template.update({
      name: command.name,
      description: command.description,
      coverId: command.coverId,
      steps: command.steps,
    });
    await this.repository.save(template);
  }
}
