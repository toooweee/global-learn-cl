import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDepartmentQuery } from '@/modules/organization/department/application/queries/find-department/find-department.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { Department } from '@generated/client';

@QueryHandler(FindDepartmentQuery)
export class FindDepartmentQueryHandler implements IQueryHandler<
  FindDepartmentQuery,
  Department
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindDepartmentQuery): Promise<Department> {
    const record = await this.prismaService.client.department.findUnique({
      where: { id: query.id },
    });
    if (!record) {
      throw new ApplicationException(
        'Department not found',
        404,
        'DEPARTMENT_NOT_FOUND',
      );
    }
    return record;
  }
}
