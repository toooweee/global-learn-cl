import { Injectable } from '@nestjs/common';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PositionRepositoryPort } from '@/modules/organization/position/application/ports/position.repository.port';
import { PositionEntity } from '@/modules/organization/position/domain/position.entity';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PositionMapper } from '@/modules/organization/position/position.mapper';
import { AggregateId } from '@/libs/ddd/entity.base';
import { None, Option, Some } from 'oxide.ts';

@Injectable()
export class PositionPrismaRepository
  extends PrismaRepositoryBase
  implements PositionRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: PositionMapper,
  ) {
    super(prismaService);
  }

  async save(entity: PositionEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);
    await this.db.position.upsert({
      where: { id: data.id },
      create: data,
      update: {
        name: data.name,
        parentId: data.parentId,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: AggregateId): Promise<Option<PositionEntity>> {
    const record = await this.db.position.findUnique({ where: { id } });
    return record ? Some(this.mapper.toDomain(record)) : None;
  }

  async findByName(name: string): Promise<PositionEntity | null> {
    const record = await this.db.position.findUnique({ where: { name } });
    return record ? this.mapper.toDomain(record) : null;
  }

  async delete(entity: PositionEntity): Promise<void> {
    await this.db.position.delete({ where: { id: entity.id } });
  }
}
