import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindEmployeeQuery } from '@/modules/employee/application/queries/find-employee/find-employee.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { EmployeeResponseDto } from '@/modules/employee/presentation/dto/employee.response.dto';

@QueryHandler(FindEmployeeQuery)
export class FindEmployeeQueryHandler implements IQueryHandler<
  FindEmployeeQuery,
  EmployeeResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindEmployeeQuery): Promise<EmployeeResponseDto> {
    const record = await this.prismaService.client.employee.findUnique({
      where: { id: query.id },
      include: {
        user: { include: { role: true } },
        division: { include: { department: true } },
      },
    });
    if (!record) {
      throw new ApplicationException(
        'Employee not found',
        404,
        'EMPLOYEE_NOT_FOUND',
      );
    }
    return new EmployeeResponseDto({
      id: record.id,
      fullname: record.fullname,
      biography: record.biography,
      employmentDate: record.employmentDate,
      dismissalDate: record.dismissalDate,
      divisionId: record.divisionId,
      positionId: record.positionId,
      avatarId: record.avatarId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      email: record.user.email,
      role: { id: record.user.role.id, name: record.user.role.name },
      department: {
        id: record.division.department.id,
        name: record.division.department.name,
      },
    });
  }
}
