import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OnboardingTemplateEntity } from '@/modules/onboarding/template/domain/template.entity';
import { CreateOnboardingTemplateCommand } from '@/modules/onboarding/template/application/create-template/create-template.command';
import { ONBOARDING_TEMPLATE_REPOSITORY } from '@/modules/onboarding/template/application/ports/template.repository.port';
import type { OnboardingTemplateRepositoryPort } from '@/modules/onboarding/template/application/ports/template.repository.port';
import { IdResponseDto } from '@/libs/api/dto';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreateOnboardingTemplateCommand)
export class CreateOnboardingTemplateHandler implements ICommandHandler<
  CreateOnboardingTemplateCommand,
  IdResponseDto
> {
  constructor(
    @Inject(ONBOARDING_TEMPLATE_REPOSITORY)
    private readonly repository: OnboardingTemplateRepositoryPort,
  ) {}

  async execute(
    command: CreateOnboardingTemplateCommand,
  ): Promise<IdResponseDto> {
    return this.repository.transaction(async () => {
      const existing = await this.repository.findForRole(
        command.positionId ?? null,
        command.divisionId,
      );
      if (existing.isSome()) {
        throw new ApplicationException(
          'Onboarding template for this position and division already exists',
          409,
          'ONBOARDING_TEMPLATE_ALREADY_EXISTS',
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

      return new IdResponseDto(template.id);
    });
  }
}
