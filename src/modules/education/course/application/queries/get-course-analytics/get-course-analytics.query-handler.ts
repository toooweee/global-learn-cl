import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  CourseAnalyticsResponseDto,
  DepartmentEnrollmentDto,
  DivisionEnrollmentDto,
  EnrollmentStatsDto,
} from '@/modules/education/course/presentation/dto/course-analytics.response.dto';
import { GetCourseAnalyticsQuery } from './get-course-analytics.query';

@QueryHandler(GetCourseAnalyticsQuery)
export class GetCourseAnalyticsQueryHandler implements IQueryHandler<
  GetCourseAnalyticsQuery,
  CourseAnalyticsResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: GetCourseAnalyticsQuery,
  ): Promise<CourseAnalyticsResponseDto> {
    const course = await this.prismaService.client.course.findUnique({
      where: { id: query.courseId },
      select: { id: true, name: true },
    });
    if (!course) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const enrollments =
      await this.prismaService.client.courseEnrollment.findMany({
        where: { courseId: query.courseId },
        select: {
          status: true,
          employee: {
            select: {
              division: {
                select: {
                  id: true,
                  name: true,
                  department: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;

    const divisionMap = new Map<
      string,
      { name: string; total: number; completed: number }
    >();
    const departmentMap = new Map<
      string,
      { name: string; total: number; completed: number }
    >();

    for (const e of enrollments) {
      if (e.status === 'IN_PROGRESS') inProgress++;
      else if (e.status === 'COMPLETED') completed++;
      else if (e.status === 'CANCELLED') cancelled++;

      const { division } = e.employee;
      const { department } = division;
      const isCompleted = e.status === 'COMPLETED';

      const divEntry = divisionMap.get(division.id) ?? {
        name: division.name,
        total: 0,
        completed: 0,
      };
      divEntry.total++;
      if (isCompleted) divEntry.completed++;
      divisionMap.set(division.id, divEntry);

      const deptEntry = departmentMap.get(department.id) ?? {
        name: department.name,
        total: 0,
        completed: 0,
      };
      deptEntry.total++;
      if (isCompleted) deptEntry.completed++;
      departmentMap.set(department.id, deptEntry);
    }

    const total = enrollments.length;

    return new CourseAnalyticsResponseDto({
      courseId: course.id,
      courseName: course.name,
      enrollments: new EnrollmentStatsDto({
        total,
        inProgress,
        completed,
        cancelled,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }),
      byDivision: Array.from(divisionMap.entries()).map(
        ([id, s]) =>
          new DivisionEnrollmentDto({
            divisionId: id,
            divisionName: s.name,
            total: s.total,
            completed: s.completed,
            completionRate:
              s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
          }),
      ),
      byDepartment: Array.from(departmentMap.entries()).map(
        ([id, s]) =>
          new DepartmentEnrollmentDto({
            departmentId: id,
            departmentName: s.name,
            total: s.total,
            completed: s.completed,
            completionRate:
              s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
          }),
      ),
    });
  }
}
