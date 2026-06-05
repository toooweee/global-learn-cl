import { Option } from 'oxide.ts';
import { BaseRepositoryPort } from '@/libs/application/repository.port';
import { AggregateId } from '@/libs/ddd/entity.base';
import { OnboardingEntity } from '@/modules/onboarding/assignment/domain/onboarding.entity';

export const ONBOARDING_REPOSITORY = Symbol('ONBOARDING_REPOSITORY');

export interface OnboardingRepositoryPort extends BaseRepositoryPort {
  save(onboarding: OnboardingEntity): Promise<void>;
  findById(id: AggregateId): Promise<Option<OnboardingEntity>>;
  findByAssignee(assignedToId: AggregateId): Promise<OnboardingEntity[]>;
}
