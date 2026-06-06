import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOnboardingTemplateCommand } from '@/modules/onboarding/template/application/create-template/create-template.command';
import { CreateOnboardingTemplateRequestDto } from '@/modules/onboarding/template/presentation/dto/create-template.request.dto';
import { IdResponseDto } from '@/libs/api/dto';

@ApiTags('onboarding-templates')
@Controller('onboarding/templates')
export class OnboardingTemplateController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Create an onboarding template for a role' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiConflictResponse()
  @Post()
  async create(
    @Body() body: CreateOnboardingTemplateRequestDto,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute<
      CreateOnboardingTemplateCommand,
      IdResponseDto
    >(new CreateOnboardingTemplateCommand(body));
  }
}
