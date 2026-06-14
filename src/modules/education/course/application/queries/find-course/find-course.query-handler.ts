import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { courseInclude } from '@/modules/education/course/course.mapper';
import {
  AuthorSummaryDto,
  CourseScopeDto,
  CourseResponseDto,
  EnrollmentProgressDto,
  ModuleResponseDto,
  StepResponseDto,
} from '@/modules/education/course/presentation/dto/course.response.dto';
import { FindCourseQuery } from './find-course.query';
import { CacheService, CACHE_NS, CACHE_TTL } from '@/infra/cache/cache.service';

@QueryHandler(FindCourseQuery)
export class FindCourseQueryHandler implements IQueryHandler<
  FindCourseQuery,
  CourseResponseDto
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(query: FindCourseQuery): Promise<CourseResponseDto> {
    const userId = RequestContextService.getUserId();

    // Cached per (course, user): the card embeds this user's per-step
    // completion and is scope-checked. Errors (404/403) propagate uncached.
    return this.cache.getOrSet(
      CACHE_NS.COURSES,
      ['card', query.courseId, userId],
      CACHE_TTL.COURSES,
      () => this.queryCourse(query, userId),
    );
  }

  private async queryCourse(
    query: FindCourseQuery,
    userId: string | undefined,
  ): Promise<CourseResponseDto> {
    const [row, enrollment] = await Promise.all([
      this.prismaService.client.course.findUnique({
        where: { id: query.courseId },
        include: courseInclude,
      }),
      userId
        ? this.prismaService.client.courseEnrollment.findUnique({
            where: {
              courseId_employeeId: {
                courseId: query.courseId,
                employeeId: userId,
              },
            },
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
              progress: { select: { stepId: true, completedAt: true } },
            },
          })
        : Promise.resolve(null),
    ]);

    if (!row) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const userRole = RequestContextService.getUserRole();
    if (userRole !== 'admin' && userId && row.scope !== 'ALL') {
      const employee = await this.prismaService.client.employee.findUnique({
        where: { id: userId },
        select: {
          divisionId: true,
          division: { select: { departmentId: true } },
        },
      });
      if (employee) {
        const forbidden =
          (row.scope === 'DEPARTMENT' &&
            employee.division?.departmentId !== row.departmentId) ||
          (row.scope === 'DIVISION' && employee.divisionId !== row.divisionId);
        if (forbidden) {
          throw new ApplicationException(
            'Access to this course is restricted',
            403,
            'COURSE_SCOPE_FORBIDDEN',
          );
        }
      }
    }

    const completedStepIds = new Set<string>();
    let enrollmentDto: EnrollmentProgressDto | undefined;

    if (enrollment) {
      enrollment.progress
        .filter((p) => p.completedAt !== null)
        .forEach((p) => completedStepIds.add(p.stepId));

      const allStepIds = row.modules.flatMap((m) => m.steps.map((s) => s.id));
      const completedSteps = allStepIds.filter((id) =>
        completedStepIds.has(id),
      ).length;
      const totalSteps = allStepIds.length;

      enrollmentDto = new EnrollmentProgressDto({
        enrollmentId: enrollment.id,
        status: enrollment.status,
        completedSteps,
        totalSteps,
        completionRate:
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
        startedAt: enrollment.startedAt ?? undefined,
        completedAt: enrollment.completedAt ?? undefined,
      });
    }

    const scopeInfo = new CourseScopeDto({
      scope: row.scope,
      departmentId: row.departmentId ?? undefined,
      departmentName: row.department?.name,
      divisionId: row.divisionId ?? undefined,
      divisionName: row.division?.name,
    });

    return new CourseResponseDto({
      id: row.id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      name: row.name,
      description: row.description,
      isArchived: row.isArchived,
      author: new AuthorSummaryDto({
        id: row.authorId,
        fullname: row.author?.fullname ?? '',
        avatarId: row.author?.avatarId,
      }),
      coverId: row.coverId,
      scopeInfo,
      modules: row.modules.map(
        (mod) =>
          new ModuleResponseDto({
            id: mod.id,
            name: mod.name,
            position: mod.position,
            steps: mod.steps.map(
              (step) =>
                new StepResponseDto({
                  id: step.id,
                  name: step.name,
                  position: step.position,
                  type: step.type,
                  lessonId: step.lessonId ?? undefined,
                  lessonName: step.lesson?.name ?? undefined,
                  lessonContent: step.lesson?.content ?? undefined,
                  testId: step.testId ?? undefined,
                  testName: step.test?.name ?? undefined,
                  testPassingPercent: step.test?.passingPercent ?? undefined,
                  isCompleted: completedStepIds.has(step.id),
                }),
            ),
          }),
      ),
      enrollment: enrollmentDto,
    });
  }
}
