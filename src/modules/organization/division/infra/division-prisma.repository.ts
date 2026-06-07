import { Injectable } from '@nestjs/common';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { DivisionRepositoryPort } from '@/modules/organization/division/application/ports/division.repository.port';
import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { DivisionMapper } from '@/modules/organization/division/division.mapper';
import { AggregateId } from '@/libs/ddd/entity.base';
import { None, Option, Some } from 'oxide.ts';

@Injectable()
export class DivisionPrismaRepository
  extends PrismaRepositoryBase
  implements DivisionRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: DivisionMapper,
  ) {
    super(prismaService);
  }

  async save(entity: DivisionEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);
    await this.db.division.upsert({
      where: { id: data.id },
      create: data,
      update: {
        name: data.name,
        departmentId: data.departmentId,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: AggregateId): Promise<Option<DivisionEntity>> {
    const record = await this.db.division.findUnique({ where: { id } });
    return record ? Some(this.mapper.toDomain(record)) : None;
  }

  async findByName(name: string): Promise<DivisionEntity | null> {
    const record = await this.db.division.findUnique({ where: { name } });
    return record ? this.mapper.toDomain(record) : null;
  }

  async delete(entity: DivisionEntity): Promise<void> {
    await this.db.division.delete({ where: { id: entity.id } });
  }
}
