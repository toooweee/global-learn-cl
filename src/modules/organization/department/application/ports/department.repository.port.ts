import { RepositoryPort } from '@/libs/application';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';

export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');

export interface DepartmentRepositoryPort extends RepositoryPort<DepartmentEntity> {
  findByName(name: string): Promise<DepartmentEntity | null>;
}
