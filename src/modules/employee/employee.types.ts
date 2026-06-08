import { AggregateId } from '@/libs/ddd/entity.base';

export interface EmployeeProps {
  fullname: string;
  biography: string | null;
  birthDate: Date | null;
  employmentDate: Date;
  dismissalDate: Date | null;
  divisionId: string;
  positionId: string | null;
  avatarId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeProps {
  id: string;
  fullname: string;
  biography?: string | null;
  birthDate?: Date | null;
  employmentDate: Date;
  dismissalDate?: Date | null;
  divisionId: string;
  positionId?: string | null;
  avatarId?: string | null;
}

export interface RecreateEmployeeProps {
  id: AggregateId;
  props: EmployeeProps;
}
