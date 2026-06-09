import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { CourseEntity } from '@/modules/education/course/domain/course.entity';

export const courseInclude = {
  modules: {
    orderBy: { position: 'asc' as const },
    include: {
      steps: {
        orderBy: { position: 'asc' as const },
        include: {
          lesson: { select: { id: true, name: true, content: true } },
          test: { select: { id: true, name: true, passingPercent: true } },
        },
      },
    },
  },
  department: { select: { id: true, name: true } },
  division: { select: { id: true, name: true } },
  author: { select: { fullname: true, avatarId: true } },
} satisfies Prisma.CourseInclude;

export type CourseRecord = Prisma.CourseGetPayload<{
  include: typeof courseInclude;
}>;

@Injectable()
export class CourseMapper implements ToDomain<CourseRecord, CourseEntity> {
  toDomain(row: CourseRecord): CourseEntity {
    return CourseEntity.recreate({
      id: row.id,
      props: {
        name: row.name,
        description: row.description,
        scope: row.scope,
        departmentId: row.departmentId ?? undefined,
        divisionId: row.divisionId ?? undefined,
        authorId: row.authorId,
        coverId: row.coverId ?? undefined,
        isArchived: row.isArchived,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        modules: row.modules.map((mod) => ({
          id: mod.id,
          name: mod.name,
          position: mod.position,
          steps: mod.steps.map((step) => ({
            id: step.id,
            name: step.name,
            position: step.position,
            type: step.type,
            lessonId: step.lessonId ?? undefined,
            testId: step.testId ?? undefined,
          })),
        })),
      },
    });
  }
}
