import { Injectable } from '@nestjs/common';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { DepartmentRepositoryPort } from '@/modules/organization/department/application/ports/department.repository.port';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { DepartmentMapper } from '@/modules/organization/department/department.mapper';
import { AggregateId } from '@/libs/ddd/entity.base';
import { None, Option, Some } from 'oxide.ts';
import { CacheService, CACHE_NS } from '@/infra/cache/cache.service';

@Injectable()
export class DepartmentPrismaRepository
  extends PrismaRepositoryBase
  implements DepartmentRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: DepartmentMapper,
    private readonly cache: CacheService,
  ) {
    super(prismaService);
  }

  async save(entity: DepartmentEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);
    await this.db.department.upsert({
      where: { id: data.id },
      create: data,
      update: { name: data.name, updatedAt: data.updatedAt },
    });
    await this.cache.invalidate(CACHE_NS.ORG);
  }

  async findById(id: AggregateId): Promise<Option<DepartmentEntity>> {
    const record = await this.db.department.findUnique({ where: { id } });
    return record ? Some(this.mapper.toDomain(record)) : None;
  }

  async findByName(name: string): Promise<DepartmentEntity | null> {
    const record = await this.db.department.findUnique({ where: { name } });
    return record ? this.mapper.toDomain(record) : null;
  }

  async delete(entity: DepartmentEntity): Promise<void> {
    await this.db.department.delete({ where: { id: entity.id } });
    await this.cache.invalidate(CACHE_NS.ORG);
  }
}
