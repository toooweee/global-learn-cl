import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CourseRepositoryPort,
  FindCoursesParams,
} from '@/modules/education/course/application/ports/course.repository.port';
import { CourseEntity } from '@/modules/education/course/domain/course.entity';
import {
  CourseMapper,
  courseInclude,
} from '@/modules/education/course/course.mapper';
import { Paginated } from '@/libs/application/query.base';
import { CacheService, CACHE_NS } from '@/infra/cache/cache.service';

@Injectable()
export class CoursePrismaRepository
  extends PrismaRepositoryBase
  implements CourseRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: CourseMapper,
    private readonly cache: CacheService,
  ) {
    super(prismaService);
  }

  async save(entity: CourseEntity): Promise<void> {
    const props = entity.getProps();

    await this.db.course.upsert({
      where: { id: entity.id },
      update: {
        name: props.name,
        description: props.description,
        scope: props.scope,
        status: props.status,
        reviewNote: props.reviewNote ?? null,
        departmentId: props.departmentId ?? null,
        divisionId: props.divisionId ?? null,
        coverId: props.coverId ?? null,
        isArchived: props.isArchived,
        updatedAt: props.updatedAt ?? new Date(),
        modules: {
          deleteMany: {},
          create: props.modules.map((mod) => ({
            id: mod.id,
            name: mod.name,
            position: mod.position,
            steps: {
              create: mod.steps.map((step) => ({
                id: step.id,
                name: step.name,
                position: step.position,
                type: step.type,
                lessonId: step.lessonId ?? null,
                testId: step.testId ?? null,
              })),
            },
          })),
        },
      },
      create: {
        id: entity.id,
        name: props.name,
        description: props.description,
        scope: props.scope,
        status: props.status,
        reviewNote: props.reviewNote ?? null,
        departmentId: props.departmentId ?? null,
        divisionId: props.divisionId ?? null,
        authorId: props.authorId,
        coverId: props.coverId ?? null,
        isArchived: props.isArchived,
        createdAt: props.createdAt,
        modules: {
          create: props.modules.map((mod) => ({
            id: mod.id,
            name: mod.name,
            position: mod.position,
            steps: {
              create: mod.steps.map((step) => ({
                id: step.id,
                name: step.name,
                position: step.position,
                type: step.type,
                lessonId: step.lessonId ?? null,
                testId: step.testId ?? null,
              })),
            },
          })),
        },
      },
    });

    await this.cache.invalidate(CACHE_NS.COURSES);
  }

  async findById(id: string): Promise<Option<CourseEntity>> {
    const row = await this.db.course.findUnique({
      where: { id },
      include: courseInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async findMany(params: FindCoursesParams): Promise<Paginated<CourseEntity>> {
    const where = params.authorId ? { authorId: params.authorId } : {};
    const [rows, count] = await Promise.all([
      this.db.course.findMany({
        where,
        include: courseInclude,
        skip: params.offset,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.course.count({ where }),
    ]);
    const page = Math.floor(params.offset / params.limit) + 1;
    return new Paginated({
      data: rows.map((r) => this.mapper.toDomain(r)),
      count,
      limit: params.limit,
      page,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.course.delete({ where: { id } });
    await this.cache.invalidate(CACHE_NS.COURSES);
  }
}
