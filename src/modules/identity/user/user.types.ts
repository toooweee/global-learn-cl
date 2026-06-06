import { AggregateId } from '@/libs/ddd/entity.base';

export interface UserProps {
  email: string;
  hashedPassword: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  hashedPassword: string;
}

export interface RecreateUserProps {
  id: AggregateId;
  props: UserProps;
}
