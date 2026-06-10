import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';

@Injectable()
export class SubordinateCheckService {
  constructor(private readonly prismaService: PrismaService) {}

  async isSubordinate(managerId: string, employeeId: string): Promise<boolean> {
    if (managerId === employeeId) return false;

    const manager = await this.prismaService.client.employee.findUnique({
      where: { id: managerId },
      select: { positionId: true },
    });
    if (!manager?.positionId) return false;

    const allPositions = await this.prismaService.client.position.findMany({
      select: { id: true, parentId: true },
    });

    const childrenOf = new Map<string, string[]>();
    for (const p of allPositions) {
      if (p.parentId) {
        if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, []);
        childrenOf.get(p.parentId)!.push(p.id);
      }
    }

    const subordinatePositionIds = new Set<string>();
    const queue = [...(childrenOf.get(manager.positionId) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      subordinatePositionIds.add(id);
      queue.push(...(childrenOf.get(id) ?? []));
    }

    if (subordinatePositionIds.size === 0) return false;

    const employee = await this.prismaService.client.employee.findUnique({
      where: { id: employeeId },
      select: { positionId: true },
    });
    return (
      !!employee?.positionId && subordinatePositionIds.has(employee.positionId)
    );
  }
}
