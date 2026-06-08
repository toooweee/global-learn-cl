import { Option } from 'oxide.ts';
import { LessonEntity } from '@/modules/education/lesson/domain/lesson.entity';

export const LESSON_REPOSITORY = Symbol('LESSON_REPOSITORY');

export interface LessonRepositoryPort {
  save(entity: LessonEntity): Promise<void>;
  findById(id: string): Promise<Option<LessonEntity>>;
  delete(id: string): Promise<void>;
}
