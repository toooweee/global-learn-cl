import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindEmployeeQuery } from '@/modules/employee/application/queries/find-employee/find-employee.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { Employee } from '@generated/client';

@QueryHandler(FindEmployeeQuery)
export class FindEmployeeQueryHandler implements IQueryHandler<
  FindEmployeeQuery,
  Employee
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindEmployeeQuery): Promise<Employee> {
    const record = await this.prismaService.client.employee.findUnique({
      where: { id: query.id },
    });
    if (!record) {
      throw new ApplicationException(
        'Employee not found',
        404,
        'EMPLOYEE_NOT_FOUND',
      );
    }
    return record;
  }
}
