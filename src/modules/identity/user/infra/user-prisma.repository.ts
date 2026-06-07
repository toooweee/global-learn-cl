import { Injectable } from '@nestjs/common';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { UserRepositoryPort } from '@/modules/identity/user/application/ports/user.repository.port';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { AggregateId } from '@/libs/ddd/entity.base';
import { UserMapper } from '@/modules/identity/user/user.mapper';
import { None, Option, Some } from 'oxide.ts';
import { UserEntity } from '@/modules/identity/user/domain/user.entity';

@Injectable()
export class UserPrismaRepository
  extends PrismaRepositoryBase
  implements UserRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: UserMapper,
  ) {
    super(prismaService);
  }

  async save(user: UserEntity) {
    const data = this.mapper.toPersistence(user);

    await this.db.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        email: data.email,
        hashedPassword: data.hashedPassword,
        roleId: data.roleId,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: AggregateId): Promise<Option<UserEntity>> {
    const user = await this.db.user.findUnique({ where: { id } });
    return user ? Some(this.mapper.toDomain(user)) : None;
  }

  async findByEmail(email: string): Promise<Option<UserEntity>> {
    const user = await this.db.user.findUnique({ where: { email } });
    return user ? Some(this.mapper.toDomain(user)) : None;
  }

  async delete(entity: UserEntity) {
    await this.db.user.delete({ where: { id: entity.id } });
  }
}
