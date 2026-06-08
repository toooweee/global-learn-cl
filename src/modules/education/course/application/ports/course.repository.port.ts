import { Option } from 'oxide.ts';
import { CourseEntity } from '@/modules/education/course/domain/course.entity';
import { Paginated } from '@/libs/application/query.base';

export const COURSE_REPOSITORY = Symbol('COURSE_REPOSITORY');

export interface FindCoursesParams {
  limit: number;
  offset: number;
  authorId?: string;
}

export interface CourseRepositoryPort {
  save(entity: CourseEntity): Promise<void>;
  findById(id: string): Promise<Option<CourseEntity>>;
  findMany(params: FindCoursesParams): Promise<Paginated<CourseEntity>>;
  delete(id: string): Promise<void>;
}
