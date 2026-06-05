import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AssignOnboardingCommand } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command';
import { CompleteOnboardingStepCommand } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command';
import { AssignOnboardingDto } from '@/modules/onboarding/assignment/presentation/dto/assign-onboarding.dto';
import { CompleteOnboardingStepDto } from '@/modules/onboarding/assignment/presentation/dto/complete-step.dto';
import { IdResponseDto } from '@/libs/api/dto';

@Controller('onboardings')
export class OnboardingController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async assign(@Body() dto: AssignOnboardingDto): Promise<IdResponseDto> {
    return this.commandBus.execute<AssignOnboardingCommand, IdResponseDto>(
      new AssignOnboardingCommand(dto),
    );
  }

  @Post(':id/complete-step')
  async completeStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteOnboardingStepDto,
  ): Promise<void> {
    await this.commandBus.execute<CompleteOnboardingStepCommand, void>(
      new CompleteOnboardingStepCommand({
        onboardingId: id,
        stepId: dto.stepId,
        selectedOptionIds: dto.selectedOptionIds,
        feedbackText: dto.feedbackText,
      }),
    );
  }
}
