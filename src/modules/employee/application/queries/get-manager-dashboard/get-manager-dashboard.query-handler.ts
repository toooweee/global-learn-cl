import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  ManagerDashboardResponseDto,
  ManagerDashboardSummaryDto,
  SubordinateDashboardItemDto,
  SubordinateEnrollmentDto,
  SubordinateOnboardingDto,
} from '@/modules/employee/presentation/dto/manager-dashboard.response.dto';
import { GetManagerDashboardQuery } from './get-manager-dashboard.query';

@QueryHandler(GetManagerDashboardQuery)
export class GetManagerDashboardQueryHandler implements IQueryHandler<
  GetManagerDashboardQuery,
  ManagerDashboardResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: GetManagerDashboardQuery,
  ): Promise<ManagerDashboardResponseDto> {
    const manager = await this.prismaService.client.employee.findUnique({
      where: { id: query.managerEmployeeId },
      select: { positionId: true },
    });

    if (!manager?.positionId) {
      return this.emptyDashboard();
    }

    const subordinatePositionIds = await this.getAllSubordinatePositionIds(
      manager.positionId,
    );

    if (subordinatePositionIds.length === 0) {
      return this.emptyDashboard();
    }

    const employees = await this.prismaService.client.employee.findMany({
      where: {
        positionId: { in: subordinatePositionIds },
        dismissalDate: null,
      },
      select: {
        id: true,
        fullname: true,
        positionId: true,
        position: { select: { name: true } },
        divisionId: true,
        division: { select: { name: true } },
        enrollments: {
          where: { status: { not: 'CANCELLED' } },
          select: {
            id: true,
            courseId: true,
            course: {
              select: {
                name: true,
                modules: { select: { _count: { select: { steps: true } } } },
              },
            },
            status: true,
            startedAt: true,
            completedAt: true,
            progress: { select: { completedAt: true } },
          },
        },
        onboardingsReceived: {
          where: { status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            steps: { select: { completedAt: true } },
          },
        },
      },
    });

    let totalActiveEnrollments = 0;
    let totalCompletedEnrollments = 0;
    let totalActiveOnboardings = 0;
    let totalCompletedOnboardings = 0;

    const subordinates = employees.map((emp) => {
      const enrollmentDtos = emp.enrollments.map((e) => {
        const totalSteps = e.course.modules.reduce(
          (acc, m) => acc + m._count.steps,
          0,
        );
        const completedSteps = e.progress.filter((p) => p.completedAt).length;
        const completionRate =
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        if (e.status === 'IN_PROGRESS') totalActiveEnrollments++;
        if (e.status === 'COMPLETED') totalCompletedEnrollments++;

        return new SubordinateEnrollmentDto({
          enrollmentId: e.id,
          courseId: e.courseId,
          courseName: e.course.name,
          status: e.status,
          completionRate,
          completedSteps,
          totalSteps,
          startedAt: e.startedAt ?? undefined,
          completedAt: e.completedAt ?? undefined,
        });
      });

      const latestOnboarding = emp.onboardingsReceived[0];
      let onboardingDto: SubordinateOnboardingDto | undefined;
      if (latestOnboarding) {
        const totalSteps = latestOnboarding.steps.length;
        const completedSteps = latestOnboarding.steps.filter(
          (s) => s.completedAt,
        ).length;

        if (latestOnboarding.status === 'IN_PROGRESS') totalActiveOnboardings++;
        if (latestOnboarding.status === 'COMPLETED')
          totalCompletedOnboardings++;

        onboardingDto = new SubordinateOnboardingDto({
          onboardingId: latestOnboarding.id,
          name: latestOnboarding.name,
          status: latestOnboarding.status,
          completedSteps,
          totalSteps,
          startDate: latestOnboarding.startDate,
          endDate: latestOnboarding.endDate,
        });
      }

      return new SubordinateDashboardItemDto({
        id: emp.id,
        fullname: emp.fullname,
        positionId: emp.positionId ?? undefined,
        positionName: emp.position?.name,
        divisionId: emp.divisionId,
        divisionName: emp.division.name,
        enrollments: enrollmentDtos,
        activeOnboarding: onboardingDto,
      });
    });

    return new ManagerDashboardResponseDto({
      summary: new ManagerDashboardSummaryDto({
        totalSubordinates: employees.length,
        activeEnrollments: totalActiveEnrollments,
        completedEnrollments: totalCompletedEnrollments,
        activeOnboardings: totalActiveOnboardings,
        completedOnboardings: totalCompletedOnboardings,
      }),
      subordinates,
    });
  }

  private emptyDashboard(): ManagerDashboardResponseDto {
    return new ManagerDashboardResponseDto({
      summary: new ManagerDashboardSummaryDto({
        totalSubordinates: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        activeOnboardings: 0,
        completedOnboardings: 0,
      }),
      subordinates: [],
    });
  }

  private async getAllSubordinatePositionIds(
    rootPositionId: string,
  ): Promise<string[]> {
    const allPositions = await this.prismaService.client.position.findMany({
      select: { id: true, parentId: true },
    });

    const childrenMap = new Map<string, string[]>();
    for (const p of allPositions) {
      if (p.parentId) {
        if (!childrenMap.has(p.parentId)) childrenMap.set(p.parentId, []);
        childrenMap.get(p.parentId)!.push(p.id);
      }
    }

    const result: string[] = [];
    const queue = [rootPositionId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const child of childrenMap.get(current) ?? []) {
        result.push(child);
        queue.push(child);
      }
    }
    return result;
  }
}
