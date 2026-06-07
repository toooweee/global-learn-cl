import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindEmployeesQuery } from '@/modules/employee/application/queries/find-employees/find-employees.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Paginated } from '@/libs/application';
import { parsePrismaOrderBy } from '@/infra/prisma/prisma.parse-order-by';
import { Employee } from '@generated/client';

@QueryHandler(FindEmployeesQuery)
export class FindEmployeesQueryHandler implements IQueryHandler<
  FindEmployeesQuery,
  Paginated<Employee>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindEmployeesQuery): Promise<Paginated<Employee>> {
    const { limit, page, offset, divisionId } = query;
    const where = divisionId ? { divisionId } : {};

    const [count, data] = await Promise.all([
      this.prismaService.client.employee.count({ where }),
      this.prismaService.client.employee.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: parsePrismaOrderBy(query.orderBy, 'fullname'),
      }),
    ]);

    return new Paginated<Employee>({ limit, page, count, data });
  }
}
