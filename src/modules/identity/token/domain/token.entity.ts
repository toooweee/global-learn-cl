import { CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateTokenProps,
  RecreateTokenProps,
  TokenProps,
} from '@/modules/identity/token/token.types';
import { randomUUID } from 'node:crypto';

export class TokenEntity extends Entity<TokenProps> {
  protected constructor(props: CreateEntityProps<TokenProps>) {
    super(props);
  }

  static create(props: CreateTokenProps) {
    return new TokenEntity({
      id: randomUUID(),
      props,
    });
  }

  static recreate({ id, props }: RecreateTokenProps) {
    return new TokenEntity({ id, props });
  }
}
