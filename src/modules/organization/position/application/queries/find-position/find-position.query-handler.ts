import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindPositionQuery } from '@/modules/organization/position/application/queries/find-position/find-position.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { Position } from '@generated/client';

@QueryHandler(FindPositionQuery)
export class FindPositionQueryHandler implements IQueryHandler<
  FindPositionQuery,
  Position
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindPositionQuery): Promise<Position> {
    const record = await this.prismaService.client.position.findUnique({
      where: { id: query.id },
    });
    if (!record) {
      throw new ApplicationException(
        'Position not found',
        404,
        'POSITION_NOT_FOUND',
      );
    }
    return record;
  }
}
