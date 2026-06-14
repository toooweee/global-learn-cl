import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPositionTreeQuery } from '@/modules/organization/position/application/queries/get-position-tree/get-position-tree.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PositionTreeDto } from '@/modules/organization/position/presentation/dto/position.response.dto';
import { CacheService, CACHE_NS, CACHE_TTL } from '@/infra/cache/cache.service';

type PositionWithChildren = {
  id: string;
  name: string;
  parentId: string | null;
  subordinates: PositionWithChildren[];
};

@QueryHandler(GetPositionTreeQuery)
export class GetPositionTreeQueryHandler implements IQueryHandler<
  GetPositionTreeQuery,
  PositionTreeDto[]
> {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(): Promise<PositionTreeDto[]> {
    return this.cache.getOrSet(
      CACHE_NS.ORG,
      ['position-tree'],
      CACHE_TTL.ORG,
      async () => {
        const roots = await this.prismaService.client.position.findMany({
          where: { parentId: null },
          include: {
            subordinates: {
              include: {
                subordinates: {
                  include: { subordinates: true },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        return roots.map((p) => this.mapTree(p as PositionWithChildren));
      },
    );
  }

  private mapTree(p: PositionWithChildren): PositionTreeDto {
    return new PositionTreeDto({
      id: p.id,
      name: p.name,
      parentId: p.parentId,
      children: p.subordinates.map((c) => this.mapTree(c)),
    });
  }
}
