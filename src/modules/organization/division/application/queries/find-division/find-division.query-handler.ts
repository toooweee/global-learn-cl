import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDivisionQuery } from '@/modules/organization/division/application/queries/find-division/find-division.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { Division } from '@generated/client';

@QueryHandler(FindDivisionQuery)
export class FindDivisionQueryHandler implements IQueryHandler<
  FindDivisionQuery,
  Division
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindDivisionQuery): Promise<Division> {
    const record = await this.prismaService.client.division.findUnique({
      where: { id: query.id },
    });
    if (!record) {
      throw new ApplicationException(
        'Division not found',
        404,
        'DIVISION_NOT_FOUND',
      );
    }
    return record;
  }
}
