import { Injectable } from '@nestjs/common';
import { ToDomain, ToPersistence } from '@/libs/ddd/mapper.interface';
import { TokenEntity } from '@/modules/identity/token/domain/token.entity';
import { Token } from '@generated/client';

@Injectable()
export class TokenMapper
  implements ToDomain<Token, TokenEntity>, ToPersistence<TokenEntity, Token>
{
  toDomain(record: Token): TokenEntity {
    return TokenEntity.recreate({
      id: record.id,
      props: {
        hashedToken: record.hashedToken,
        userAgent: record.userAgent,
        expiresAt: record.expiresAt,
        userId: record.userId,
      },
    });
  }

  toPersistence(entity: TokenEntity): Token {
    const props = entity.getProps();
    return {
      id: props.id,
      hashedToken: props.hashedToken,
      userAgent: props.userAgent,
      expiresAt: props.expiresAt,
      userId: props.userId,
    };
  }
}
