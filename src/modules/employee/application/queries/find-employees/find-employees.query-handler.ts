import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindEmployeesQuery } from '@/modules/employee/application/queries/find-employees/find-employees.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { EmployeeResponseDto } from '@/modules/employee/presentation/dto/employee.response.dto';

@QueryHandler(FindEmployeesQuery)
export class FindEmployeesQueryHandler implements IQueryHandler<
  FindEmployeesQuery,
  Paginated<EmployeeResponseDto>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindEmployeesQuery,
  ): Promise<Paginated<EmployeeResponseDto>> {
    const { limit, page, offset, divisionId } = query;
    const where = divisionId ? { divisionId } : {};

    const [count, data] = await Promise.all([
      this.prismaService.client.employee.count({ where }),
      this.prismaService.client.employee.findMany({
        where,
        include: {
          user: { include: { role: true } },
          division: { include: { department: true } },
        },
        take: limit,
        skip: offset,
        orderBy: parsePrismaOrderBy(query.orderBy, 'fullname'),
      }),
    ]);

    return new Paginated<EmployeeResponseDto>({
      limit,
      page,
      count,
      data: data.map(
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
      ),
    });
  }
}
