import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { CourseApplicationEntity } from '@/modules/education/course-application/domain/course-application.entity';
import { CourseApplicationMapper } from '@/modules/education/course-application/course-application.mapper';
import {
  CourseApplicationRepositoryPort,
  FindApplicationsParams,
} from '@/modules/education/course-application/application/ports/course-application.repository.port';

@Injectable()
export class CourseApplicationPrismaRepository
  extends PrismaRepositoryBase
  implements CourseApplicationRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: CourseApplicationMapper,
  ) {
    super(prismaService);
  }

  async save(entity: CourseApplicationEntity): Promise<void> {
    const props = entity.getProps();
    await this.db.courseApplication.upsert({
      where: { id: entity.id },
      update: {
        status: props.status,
        updatedAt: props.updatedAt ?? new Date(),
      },
      create: {
        id: entity.id,
        courseId: props.courseId,
        employeeId: props.employeeId,
        status: props.status,
        createdAt: props.createdAt,
      },
    });
  }

  async findById(id: string): Promise<Option<CourseApplicationEntity>> {
    const row = await this.db.courseApplication.findUnique({ where: { id } });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async findByCourseAndEmployee(
    courseId: string,
    employeeId: string,
  ): Promise<Option<CourseApplicationEntity>> {
    const row = await this.db.courseApplication.findUnique({
      where: { courseId_employeeId: { courseId, employeeId } },
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async findMany(
    params: FindApplicationsParams,
  ): Promise<Paginated<CourseApplicationEntity>> {
    const where: { courseId?: string; employeeId?: string } = {};
    if (params.courseId) where.courseId = params.courseId;
    if (params.employeeId) where.employeeId = params.employeeId;

    const [rows, count] = await Promise.all([
      this.db.courseApplication.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.courseApplication.count({ where }),
    ]);

    const page = Math.floor(params.offset / params.limit) + 1;
    return new Paginated({
      data: rows.map((r) => this.mapper.toDomain(r)),
      count,
      limit: params.limit,
      page,
    });
  }
}
