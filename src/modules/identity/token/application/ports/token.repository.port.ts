import { BaseRepositoryPort } from '@/libs/application/repository.port';
import { TokenEntity } from '@/modules/identity/token/domain/token.entity';
import { Option } from 'oxide.ts';

export const TOKEN_REPOSITORY = Symbol('TOKEN_REPOSITORY');

export interface TokenRepositoryPort extends BaseRepositoryPort {
  upsertByUserAndAgent(entity: TokenEntity): Promise<void>;
  findByUserAndAgent(
    userId: string,
    userAgent: string,
  ): Promise<Option<TokenEntity>>;
  deleteByUserAndAgent(userId: string, userAgent: string): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
}
