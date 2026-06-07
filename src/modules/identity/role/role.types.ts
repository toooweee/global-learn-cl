import { AggregateId } from '@/libs/ddd/entity.base';

export interface RoleProps {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleProps {
  name: string;
}

export interface RecreateRoleProps {
  id: AggregateId;
  props: RoleProps;
}
