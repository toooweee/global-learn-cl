import { Injectable } from '@nestjs/common';
import type { CourseApplication } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { CourseApplicationEntity } from '@/modules/education/course-application/domain/course-application.entity';

@Injectable()
export class CourseApplicationMapper implements ToDomain<
  CourseApplication,
  CourseApplicationEntity
> {
  toDomain(row: CourseApplication): CourseApplicationEntity {
    return CourseApplicationEntity.recreate({
      id: row.id,
      props: {
        courseId: row.courseId,
        employeeId: row.employeeId,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  }
}
