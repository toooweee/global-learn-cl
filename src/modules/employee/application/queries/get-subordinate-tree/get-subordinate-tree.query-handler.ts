import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSubordinateTreeQuery } from '@/modules/employee/application/queries/get-subordinate-tree/get-subordinate-tree.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  SubordinateTreeNodeDto,
  SubordinateTreeEmployeeDto,
} from '@/modules/employee/presentation/dto/subordinate-tree.response.dto';

@QueryHandler(GetSubordinateTreeQuery)
export class GetSubordinateTreeQueryHandler implements IQueryHandler<
  GetSubordinateTreeQuery,
  SubordinateTreeNodeDto[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: GetSubordinateTreeQuery,
  ): Promise<SubordinateTreeNodeDto[]> {
    const manager = await this.prismaService.client.employee.findUnique({
      where: { id: query.managerUserId },
      select: { positionId: true },
    });
    if (!manager?.positionId) return [];

    const allPositions = await this.prismaService.client.position.findMany({
      select: { id: true, name: true, parentId: true },
    });

    const positionMap = new Map(allPositions.map((p) => [p.id, p]));
    const childrenOf = new Map<string, string[]>();
    for (const p of allPositions) {
      if (p.parentId) {
        if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, []);
        childrenOf.get(p.parentId)!.push(p.id);
      }
    }

    const subordinatePositionIds: string[] = [];
    const bfsQueue = [...(childrenOf.get(manager.positionId) ?? [])];
    while (bfsQueue.length > 0) {
      const id = bfsQueue.shift()!;
      subordinatePositionIds.push(id);
      bfsQueue.push(...(childrenOf.get(id) ?? []));
    }

    if (subordinatePositionIds.length === 0) return [];

    const employees = await this.prismaService.client.employee.findMany({
      where: {
        positionId: { in: subordinatePositionIds },
        dismissalDate: null,
      },
      select: {
        id: true,
        fullname: true,
        avatarId: true,
        positionId: true,
        divisionId: true,
        division: { select: { name: true } },
        user: { select: { email: true } },
      },
    });

    const byPosition = new Map<string, typeof employees>();
    for (const emp of employees) {
      if (!emp.positionId) continue;
      if (!byPosition.has(emp.positionId)) byPosition.set(emp.positionId, []);
      byPosition.get(emp.positionId)!.push(emp);
    }

    const buildNode = (positionId: string): SubordinateTreeNodeDto => {
      const pos = positionMap.get(positionId)!;
      const emps = byPosition.get(positionId) ?? [];
      return new SubordinateTreeNodeDto({
        positionId,
        positionName: pos.name,
        employees: emps.map(
          (e) =>
            new SubordinateTreeEmployeeDto({
              id: e.id,
              fullname: e.fullname,
              email: e.user.email,
              avatarId: e.avatarId,
              divisionId: e.divisionId,
              divisionName: e.division.name,
            }),
        ),
        children: (childrenOf.get(positionId) ?? [])
          .filter((childId) => subordinatePositionIds.includes(childId))
          .map(buildNode),
      });
    };

    return (childrenOf.get(manager.positionId) ?? []).map(buildNode);
  }
}
