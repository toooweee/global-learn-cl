import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { OnboardingTemplateEntity } from '@/modules/onboarding/template/domain/template.entity';
import { CreateOnboardingTemplateCommand } from '@/modules/onboarding/template/application/create-template/create-template.command';
import { ONBOARDING_TEMPLATE_REPOSITORY } from '@/modules/onboarding/template/application/ports/template.repository.port';
import type { OnboardingTemplateRepositoryPort } from '@/modules/onboarding/template/application/ports/template.repository.port';

@Injectable()
export class CreateOnboardingTemplateHandler {
  constructor(
    @Inject(ONBOARDING_TEMPLATE_REPOSITORY)
    private readonly repository: OnboardingTemplateRepositoryPort,
  ) {}

  async execute(
    command: CreateOnboardingTemplateCommand,
  ): Promise<{ id: string }> {
    return this.repository.transaction(async () => {
      const existing = await this.repository.findForRole(
        command.positionId,
        command.divisionId,
      );
      if (existing.isSome()) {
        throw new ConflictException(
          'Onboarding template for this position and division already exists',
        );
      }

      const template = OnboardingTemplateEntity.create({
        name: command.name,
        description: command.description,
        positionId: command.positionId,
        divisionId: command.divisionId,
        coverId: command.coverId,
        steps: command.steps,
      });

      await this.repository.save(template);

      return { id: template.id };
    });
  }
}
