import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe, createZodDto } from 'nestjs-zod';
import { CreateOnboardingTemplateHandler } from '@/modules/onboarding/template/application/create-template/create-template.command-handler';
import { CreateOnboardingTemplateCommand } from '@/modules/onboarding/template/application/create-template/create-template.command';

const FeedbackOptionSchema = z.object({
  label: z.string().min(1).max(255),
});

const StepSchema = z
  .object({
    position: z.number().int().min(1),
    name: z.string().min(1).max(255),
    description: z.string(),
    type: z.enum(['TEXT', 'COURSE']),
    courseId: z.string().uuid().optional(),
    recommendedStartOffsetDays: z.number().int().min(0),
    recommendedEndOffsetDays: z.number().int().min(0),
    coverId: z.string().uuid().optional(),
    feedbackOptions: z.array(FeedbackOptionSchema).default([]),
  })
  .refine((s) => (s.type === 'COURSE' ? !!s.courseId : true), {
    message: 'courseId is required when step type is COURSE',
    path: ['courseId'],
  });

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string(),
  positionId: z.string().uuid(),
  divisionId: z.string().uuid(),
  coverId: z.string().uuid().optional(),
  steps: z.array(StepSchema).min(1),
});

export class CreateOnboardingTemplateDto extends createZodDto(
  CreateTemplateSchema,
) {}

@Controller('onboarding/templates')
export class OnboardingTemplateController {
  constructor(private readonly handler: CreateOnboardingTemplateHandler) {}

  @Post()
  async create(@Body(ZodValidationPipe) body: CreateOnboardingTemplateDto) {
    return this.handler.execute(new CreateOnboardingTemplateCommand(body));
  }
}
