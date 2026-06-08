import { Option } from 'oxide.ts';
import { CourseApplicationEntity } from '@/modules/education/course-application/domain/course-application.entity';
import { Paginated } from '@/libs/application/query.base';

export const COURSE_APPLICATION_REPOSITORY = Symbol(
  'COURSE_APPLICATION_REPOSITORY',
);

export interface FindApplicationsParams {
  courseId?: string;
  employeeId?: string;
  limit: number;
  offset: number;
}

export interface CourseApplicationRepositoryPort {
  save(entity: CourseApplicationEntity): Promise<void>;
  findById(id: string): Promise<Option<CourseApplicationEntity>>;
  findByCourseAndEmployee(
    courseId: string,
    employeeId: string,
  ): Promise<Option<CourseApplicationEntity>>;
  findMany(
    params: FindApplicationsParams,
  ): Promise<Paginated<CourseApplicationEntity>>;
}
