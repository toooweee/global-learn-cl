import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { EnrollmentEntity } from '@/modules/education/enrollment/domain/enrollment.entity';

export const enrollmentInclude = {
  progress: true,
} satisfies Prisma.CourseEnrollmentInclude;

export type EnrollmentRecord = Prisma.CourseEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

@Injectable()
export class EnrollmentMapper implements ToDomain<
  EnrollmentRecord,
  EnrollmentEntity
> {
  toDomain(row: EnrollmentRecord): EnrollmentEntity {
    return EnrollmentEntity.recreate({
      id: row.id,
      props: {
        courseId: row.courseId,
        employeeId: row.employeeId,
        assignedById: row.assignedById ?? undefined,
        status: row.status,
        startedAt: row.startedAt,
        completedAt: row.completedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        progress: row.progress.map((p) => ({
          id: p.id,
          stepId: p.stepId,
          completedAt: p.completedAt ?? undefined,
          createdAt: p.createdAt,
        })),
      },
    });
  }
}
