import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import { EnrollmentEntity } from '@/modules/education/enrollment/domain/enrollment.entity';
import {
  EnrollmentMapper,
  enrollmentInclude,
} from '@/modules/education/enrollment/enrollment.mapper';
import {
  EnrollmentRepositoryPort,
  FindEnrollmentsParams,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';

@Injectable()
export class EnrollmentPrismaRepository
  extends PrismaRepositoryBase
  implements EnrollmentRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: EnrollmentMapper,
  ) {
    super(prismaService);
  }

  async save(entity: EnrollmentEntity): Promise<void> {
    const props = entity.getProps();

    await this.db.courseEnrollment.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        courseId: props.courseId,
        employeeId: props.employeeId,
        assignedById: props.assignedById ?? null,
        status: props.status,
        startedAt: props.startedAt,
        createdAt: props.createdAt,
      },
      update: {
        status: props.status,
        completedAt: props.completedAt ?? null,
        updatedAt: props.updatedAt ?? new Date(),
      },
    });

    for (const p of props.progress) {
      await this.db.stepProgress.upsert({
        where: {
          stepId_enrollmentId: { stepId: p.stepId, enrollmentId: entity.id },
        },
        create: {
          id: p.id,
          stepId: p.stepId,
          enrollmentId: entity.id,
          completedAt: p.completedAt ?? null,
          createdAt: p.createdAt,
        },
        update: {
          completedAt: p.completedAt ?? null,
        },
      });
    }
  }

  async findById(id: string): Promise<Option<EnrollmentEntity>> {
    const row = await this.db.courseEnrollment.findUnique({
      where: { id },
      include: enrollmentInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async findByCourseAndEmployee(
    courseId: string,
    employeeId: string,
  ): Promise<Option<EnrollmentEntity>> {
    const row = await this.db.courseEnrollment.findUnique({
      where: { courseId_employeeId: { courseId, employeeId } },
      include: enrollmentInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async clearProgress(enrollmentId: string): Promise<void> {
    await this.db.stepProgress.deleteMany({ where: { enrollmentId } });
  }

  async findMany(
    params: FindEnrollmentsParams,
  ): Promise<Paginated<EnrollmentEntity>> {
    const where: { employeeId?: string; courseId?: string } = {};
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.courseId) where.courseId = params.courseId;

    const [rows, count] = await Promise.all([
      this.db.courseEnrollment.findMany({
        where,
        include: enrollmentInclude,
        skip: params.offset,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.courseEnrollment.count({ where }),
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
