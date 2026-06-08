import { AggregateId } from '@/libs/ddd/entity.base';

export interface DepartmentProps {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentProps {
  name: string;
}

export interface RecreateDepartmentProps {
  id: AggregateId;
  props: DepartmentProps;
}
