import { AggregateId } from '@/libs/ddd/entity.base';

export interface TokenProps {
  hashedToken: string;
  userAgent: string;
  expiresAt: Date;
  userId: string;
}

export interface CreateTokenProps {
  hashedToken: string;
  userAgent: string;
  expiresAt: Date;
  userId: string;
}

export interface RecreateTokenProps {
  id: AggregateId;
  props: TokenProps;
}
