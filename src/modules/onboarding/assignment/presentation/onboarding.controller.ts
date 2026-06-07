import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AssignOnboardingCommand } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command';
import { CompleteOnboardingStepCommand } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command';
import { AssignOnboardingRequestDto } from '@/modules/onboarding/assignment/presentation/dto/assign-onboarding.request.dto';
import { CompleteOnboardingStepRequestDto } from '@/modules/onboarding/assignment/presentation/dto/complete-step.request.dto';
import { IdResponseDto } from '@/libs/api/dto';
import { CurrentUser } from '@/libs/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/libs/auth/decorators/current-user.decorator';

@ApiTags('onboardings')
@Controller('onboardings')
export class OnboardingController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Assign an onboarding from a template' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiNotFoundResponse()
  @Post()
  async assign(
    @Body() body: AssignOnboardingRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<IdResponseDto> {
    return this.commandBus.execute<AssignOnboardingCommand, IdResponseDto>(
      new AssignOnboardingCommand({ ...body, assignedById: user.userId }),
    );
  }

  @ApiOperation({ summary: 'Complete the current step of an onboarding' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Post(':id/complete-step')
  async completeStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CompleteOnboardingStepRequestDto,
  ): Promise<void> {
    await this.commandBus.execute<CompleteOnboardingStepCommand, void>(
      new CompleteOnboardingStepCommand({
        onboardingId: id,
        stepId: body.stepId,
        selectedOptionIds: body.selectedOptionIds,
        feedbackText: body.feedbackText,
      }),
    );
  }
}
