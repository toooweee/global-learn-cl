import { AggregateId } from '@/libs/ddd/entity.base';

export interface DepartmentProps {
  name: string;
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
