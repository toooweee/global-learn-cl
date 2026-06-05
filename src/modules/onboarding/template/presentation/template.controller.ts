import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateOnboardingTemplateCommand } from '@/modules/onboarding/template/application/create-template/create-template.command';
import { CreateOnboardingTemplateDto } from '@/modules/onboarding/template/presentation/dto/create-template.dto';
import { IdResponseDto } from '@/libs/api/dto';

@Controller('onboarding/templates')
export class OnboardingTemplateController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(
    @Body() dto: CreateOnboardingTemplateDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute<
      CreateOnboardingTemplateCommand,
      IdResponseDto
    >(new CreateOnboardingTemplateCommand(dto));
  }
}
