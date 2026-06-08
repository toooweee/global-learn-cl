import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { LessonEntity } from '@/modules/education/lesson/domain/lesson.entity';
import { LessonMapper } from '@/modules/education/lesson/lesson.mapper';
import { LessonRepositoryPort } from '@/modules/education/lesson/application/ports/lesson.repository.port';

@Injectable()
export class LessonPrismaRepository
  extends PrismaRepositoryBase
  implements LessonRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: LessonMapper,
  ) {
    super(prismaService);
  }

  async save(entity: LessonEntity): Promise<void> {
    const props = entity.getProps();
    await this.db.lesson.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        name: props.name,
        content: props.content,
        createdAt: props.createdAt,
      },
      update: {
        name: props.name,
        content: props.content,
        updatedAt: props.updatedAt ?? new Date(),
      },
    });
  }

  async findById(id: string): Promise<Option<LessonEntity>> {
    const row = await this.db.lesson.findUnique({ where: { id } });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async delete(id: string): Promise<void> {
    await this.db.lesson.delete({ where: { id } });
  }
}
