import { RepositoryPort } from '@/libs/application';
import { EmployeeEntity } from '@/modules/employee/domain/employee.entity';

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface EmployeeRepositoryPort extends RepositoryPort<EmployeeEntity> {
  findByDivision(divisionId: string): Promise<EmployeeEntity[]>;
  findByPosition(positionId: string): Promise<EmployeeEntity[]>;
}
