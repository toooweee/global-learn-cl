import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe, createZodDto } from 'nestjs-zod';
import { AssignOnboardingHandler } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command-handler';
import { AssignOnboardingCommand } from '@/modules/onboarding/assignment/application/assign-onboarding/assign-onboarding.command';
import { CompleteOnboardingStepHandler } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command-handler';
import { CompleteOnboardingStepCommand } from '@/modules/onboarding/assignment/application/complete-step/complete-step.command';

const AssignSchema = z
  .object({
    templateId: z.string().uuid(),
    assignedById: z.string().uuid(),
    assignedToId: z.string().uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    nameOverride: z.string().min(1).max(255).optional(),
    descriptionOverride: z.string().optional(),
  })
  .refine((p) => p.endDate > p.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

const CompleteStepSchema = z
  .object({
    stepId: z.string().uuid(),
    selectedOptionIds: z.array(z.string().uuid()).default([]),
    feedbackText: z.string().optional(),
  })
  .refine(
    (p) =>
      p.selectedOptionIds.length > 0 ||
      (p.feedbackText && p.feedbackText.trim().length > 0),
    { message: 'Provide feedback options or text', path: ['feedbackText'] },
  );

export class AssignOnboardingDto extends createZodDto(AssignSchema) {}
export class CompleteOnboardingStepDto extends createZodDto(
  CompleteStepSchema,
) {}

@Controller('onboardings')
export class OnboardingController {
  constructor(
    private readonly assignHandler: AssignOnboardingHandler,
    private readonly completeStepHandler: CompleteOnboardingStepHandler,
  ) {}

  @Post()
  async assign(@Body(ZodValidationPipe) body: AssignOnboardingDto) {
    return this.assignHandler.execute(new AssignOnboardingCommand(body));
  }

  @Post(':id/complete-step')
  async completeStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ZodValidationPipe) body: CompleteOnboardingStepDto,
  ): Promise<void> {
    await this.completeStepHandler.execute(
      new CompleteOnboardingStepCommand({
        onboardingId: id,
        stepId: body.stepId,
        selectedOptionIds: body.selectedOptionIds,
        feedbackText: body.feedbackText,
      }),
    );
  }
}
