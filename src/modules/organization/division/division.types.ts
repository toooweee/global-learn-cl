import { AggregateId } from '@/libs/ddd/entity.base';

export interface DivisionProps {
  name: string;
  departmentId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDivisionProps {
  name: string;
  departmentId: string;
}

export interface RecreateDivisionProps {
  id: AggregateId;
  props: DivisionProps;
}
