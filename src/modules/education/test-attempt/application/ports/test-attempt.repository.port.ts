import { Option } from 'oxide.ts';
import { TestAttemptEntity } from '@/modules/education/test-attempt/domain/test-attempt.entity';

export const TEST_ATTEMPT_REPOSITORY = Symbol('TEST_ATTEMPT_REPOSITORY');

export interface TestAttemptRepositoryPort {
  save(entity: TestAttemptEntity): Promise<void>;
  findById(id: string): Promise<Option<TestAttemptEntity>>;
}
