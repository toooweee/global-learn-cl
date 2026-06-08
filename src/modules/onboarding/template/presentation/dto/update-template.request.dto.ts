import { OmitType } from '@nestjs/swagger';
import { CreateOnboardingTemplateRequestDto } from './create-template.request.dto';

export class UpdateOnboardingTemplateRequestDto extends OmitType(
  CreateOnboardingTemplateRequestDto,
  ['positionId', 'divisionId'] as const,
) {}
