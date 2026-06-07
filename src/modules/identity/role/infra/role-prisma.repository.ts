import { Injectable } from '@nestjs/common';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { RoleRepositoryPort } from '@/modules/identity/role/application/ports/role.repository.port';
import { RoleEntity } from '@/modules/identity/role/domain/role.entity';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RoleMapper } from '@/modules/identity/role/role.mapper';
import { AggregateId } from '@/libs/ddd/entity.base';
import { None, Option, Some } from 'oxide.ts';

@Injectable()
export class RolePrismaRepository
  extends PrismaRepositoryBase
  implements RoleRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: RoleMapper,
  ) {
    super(prismaService);
  }

  async save(entity: RoleEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);
    await this.db.role.upsert({
      where: { id: data.id },
      create: data,
      update: { name: data.name, updatedAt: data.updatedAt },
    });
  }

  async findById(id: AggregateId): Promise<Option<RoleEntity>> {
    const record = await this.db.role.findUnique({ where: { id } });
    return record ? Some(this.mapper.toDomain(record)) : None;
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    const record = await this.db.role.findUnique({ where: { name } });
    return record ? this.mapper.toDomain(record) : null;
  }

  async delete(entity: RoleEntity): Promise<void> {
    await this.db.role.delete({ where: { id: entity.id } });
  }
}
