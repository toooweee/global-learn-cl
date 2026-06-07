import { AggregateId } from '@/libs/ddd/entity.base';

export interface UserProps {
  email: string;
  hashedPassword: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  hashedPassword: string;
  roleId: string;
}

export interface RecreateUserProps {
  id: AggregateId;
  props: UserProps;
}
