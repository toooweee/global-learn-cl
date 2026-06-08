import { Option } from 'oxide.ts';
import { EnrollmentEntity } from '@/modules/education/enrollment/domain/enrollment.entity';
import { Paginated } from '@/libs/application/query.base';

export const ENROLLMENT_REPOSITORY = Symbol('ENROLLMENT_REPOSITORY');

export interface FindEnrollmentsParams {
  employeeId?: string;
  courseId?: string;
  limit: number;
  offset: number;
}

export interface EnrollmentRepositoryPort {
  save(entity: EnrollmentEntity): Promise<void>;
  findById(id: string): Promise<Option<EnrollmentEntity>>;
  findByCourseAndEmployee(
    courseId: string,
    employeeId: string,
  ): Promise<Option<EnrollmentEntity>>;
  findMany(params: FindEnrollmentsParams): Promise<Paginated<EnrollmentEntity>>;
}
