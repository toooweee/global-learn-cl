import { Injectable } from '@nestjs/common';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { TokenRepositoryPort } from '@/modules/identity/token/application/ports/token.repository.port';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TokenMapper } from '@/modules/identity/token/token.mapper';
import { TokenEntity } from '@/modules/identity/token/domain/token.entity';
import { None, Option, Some } from 'oxide.ts';

@Injectable()
export class TokenPrismaRepository
  extends PrismaRepositoryBase
  implements TokenRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: TokenMapper,
  ) {
    super(prismaService);
  }

  async upsertByUserAndAgent(entity: TokenEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);

    await this.db.token.upsert({
      where: {
        userId_userAgent: { userId: data.userId, userAgent: data.userAgent },
      },
      create: data,
      update: {
        hashedToken: data.hashedToken,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByUserAndAgent(
    userId: string,
    userAgent: string,
  ): Promise<Option<TokenEntity>> {
    const token = await this.db.token.findUnique({
      where: { userId_userAgent: { userId, userAgent } },
    });
    return token ? Some(this.mapper.toDomain(token)) : None;
  }

  async deleteByUserAndAgent(userId: string, userAgent: string): Promise<void> {
    await this.db.token.deleteMany({ where: { userId, userAgent } });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.db.token.deleteMany({ where: { userId } });
  }
}
