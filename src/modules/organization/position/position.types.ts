import { AggregateId } from '@/libs/ddd/entity.base';

export interface PositionProps {
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePositionProps {
  name: string;
  parentId?: string | null;
}

export interface RecreatePositionProps {
  id: AggregateId;
  props: PositionProps;
}
