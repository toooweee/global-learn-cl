import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindMySubordinatesQuery } from '@/modules/employee/application/queries/find-my-subordinates/find-my-subordinates.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { EmployeeResponseDto } from '@/modules/employee/presentation/dto/employee.response.dto';

@QueryHandler(FindMySubordinatesQuery)
export class FindMySubordinatesQueryHandler implements IQueryHandler<
  FindMySubordinatesQuery,
  EmployeeResponseDto[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindMySubordinatesQuery,
  ): Promise<EmployeeResponseDto[]> {
    const me = await this.prismaService.client.employee.findUnique({
      where: { id: query.currentEmployeeId },
      select: { positionId: true },
    });

    if (!me?.positionId) return [];

    const rows = await this.prismaService.client.employee.findMany({
      where: {
        position: { parentId: me.positionId },
        dismissalDate: null,
      },
      include: {
        user: { include: { role: true } },
        division: { include: { department: true } },
      },
    });

    return rows.map(
      (e) =>
        new EmployeeResponseDto({
          id: e.id,
          fullname: e.fullname,
          biography: e.biography,
          employmentDate: e.employmentDate,
          dismissalDate: e.dismissalDate,
          divisionId: e.divisionId,
          positionId: e.positionId,
          avatarId: e.avatarId,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
          email: e.user.email,
          role: { id: e.user.role.id, name: e.user.role.name },
          department: {
            id: e.division.department.id,
            name: e.division.department.name,
          },
        }),
    );
  }
}
