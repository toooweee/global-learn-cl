import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindMySubordinatesQuery } from '@/modules/employee/application/queries/find-my-subordinates/find-my-subordinates.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { Employee } from '@generated/client';

@QueryHandler(FindMySubordinatesQuery)
export class FindMySubordinatesQueryHandler implements IQueryHandler<
  FindMySubordinatesQuery,
  Employee[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindMySubordinatesQuery): Promise<Employee[]> {
    const me = await this.prismaService.client.employee.findUnique({
      where: { id: query.currentEmployeeId },
      select: { positionId: true },
    });

    if (!me?.positionId) return [];

    return this.prismaService.client.employee.findMany({
      where: {
        position: { parentId: me.positionId },
        dismissalDate: null,
      },
    });
  }
}
