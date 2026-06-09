import { Option } from 'oxide.ts';
import { BaseRepositoryPort } from '@/libs/application/repository.port';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingTemplateEntity } from '@/modules/onboarding/template/domain/template.entity';

export const ONBOARDING_TEMPLATE_REPOSITORY = Symbol(
  'ONBOARDING_TEMPLATE_REPOSITORY',
);

export interface OnboardingTemplateRepositoryPort extends BaseRepositoryPort {
  save(template: OnboardingTemplateEntity): Promise<void>;
  findById(id: AggregateId): Promise<Option<OnboardingTemplateEntity>>;
  findForRole(
    positionId: string | null,
    divisionId: AggregateId,
  ): Promise<Option<OnboardingTemplateEntity>>;
}
