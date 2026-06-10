import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application/query.base';
import {
  CourseScopeDto,
  CourseSummaryResponseDto,
  EnrollmentProgressDto,
} from '@/modules/education/course/presentation/dto/course.response.dto';
import { FindCoursesQuery } from './find-courses.query';
import { COURSE_CREATOR_ROLES } from '@/libs/auth/roles.constants';

@QueryHandler(FindCoursesQuery)
export class FindCoursesQueryHandler implements IQueryHandler<
  FindCoursesQuery,
  Paginated<CourseSummaryResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindCoursesQuery,
  ): Promise<Paginated<CourseSummaryResponseDto>> {
    const userId = RequestContextService.getUserId();

    const userRole = RequestContextService.getUserRole();
    const isAdmin = userRole === 'admin';

    // Course creators (dept_head / division_head) can see their own non-published courses
    const isContentCreator =
      COURSE_CREATOR_ROLES.includes(userRole as never) && !isAdmin;
    const where: Record<string, unknown> = {};
    if (!query.includeArchived) where.isArchived = false;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    if (isAdmin) {
      // Admin: apply all explicit filters as-is, sees all statuses
      if (query.authorId) where.authorId = query.authorId;
      if (query.scope) where.scope = query.scope;
      if (query.departmentId) where.departmentId = query.departmentId;
      if (query.divisionId) where.divisionId = query.divisionId;
    } else if (userId) {
      // Non-admins: only PUBLISHED courses + their own drafts/pending/rejected
      const employee = await this.prismaService.client.employee.findUnique({
        where: { id: userId },
        select: {
          divisionId: true,
          division: { select: { departmentId: true } },
        },
      });
      const scopeFilter = employee
        ? [
            { scope: 'ALL' },
            {
              scope: 'DEPARTMENT',
              departmentId: employee.division?.departmentId ?? null,
            },
            { scope: 'DIVISION', divisionId: employee.divisionId },
          ]
        : [{ scope: 'ALL' }];

      where.OR = [
        // PUBLISHED within their scope
        { status: 'PUBLISHED', AND: [{ OR: scopeFilter }] },
        // Their own non-published courses (course creators only)
        ...(isContentCreator
          ? [{ authorId: userId, status: { not: 'PUBLISHED' } }]
          : []),
      ];
      if (query.authorId) where.authorId = query.authorId;
    }

    const [count, rows] = await Promise.all([
      this.prismaService.client.course.count({ where }),
      this.prismaService.client.course.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          authorId: true,
          coverId: true,
          createdAt: true,
          updatedAt: true,
          scope: true,
          status: true,
          reviewNote: true,
          departmentId: true,
          divisionId: true,
          isArchived: true,
          department: { select: { id: true, name: true } },
          division: { select: { id: true, name: true } },
          _count: { select: { modules: true } },
          modules: { select: { _count: { select: { steps: true } } } },
        },
      }),
    ]);

    const courseIds = rows.map((r) => r.id);

    const enrollments =
      userId && courseIds.length > 0
        ? await this.prismaService.client.courseEnrollment.findMany({
            where: { courseId: { in: courseIds }, employeeId: userId },
            select: {
              id: true,
              courseId: true,
              status: true,
              completedAt: true,
              progress: { select: { stepId: true, completedAt: true } },
            },
          })
        : [];

    const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));

    return new Paginated({
      count,
      limit: query.limit,
      page: query.page,
      data: rows.map((row) => {
        const totalSteps = row.modules.reduce(
          (acc, m) => acc + m._count.steps,
          0,
        );
        const enrollment = enrollmentMap.get(row.id);
        let enrollmentDto: EnrollmentProgressDto | undefined;

        if (enrollment) {
          const completedSteps = enrollment.progress.filter(
            (p) => p.completedAt !== null,
          ).length;
          enrollmentDto = new EnrollmentProgressDto({
            enrollmentId: enrollment.id,
            status: enrollment.status,
            completedSteps,
            totalSteps,
            completionRate:
              totalSteps > 0
                ? Math.round((completedSteps / totalSteps) * 100)
                : 0,
            completedAt: enrollment.completedAt ?? undefined,
          });
        }

        return new CourseSummaryResponseDto({
          id: row.id,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          name: row.name,
          description: row.description,
          authorId: row.authorId,
          coverId: row.coverId,
          isArchived: row.isArchived,
          status: row.status,
          reviewNote: row.reviewNote ?? undefined,
          scopeInfo: new CourseScopeDto({
            scope: row.scope,
            departmentId: row.departmentId ?? undefined,
            departmentName: row.department?.name,
            divisionId: row.divisionId ?? undefined,
            divisionName: row.division?.name,
          }),
          moduleCount: row._count.modules,
          enrollment: enrollmentDto,
        });
      }),
    });
  }
}
