import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMeQuery } from '@/modules/identity/auth/application/queries/get-me/get-me.query';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { MeResponseDto } from '@/modules/identity/auth/presentation/dto/me.response.dto';

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<
  GetMeQuery,
  MeResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetMeQuery): Promise<MeResponseDto> {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: query.userId },
      include: { role: true },
    });

    if (!user) {
      throw new ApplicationException('User not found', 404, 'USER_NOT_FOUND');
    }

    return new MeResponseDto({
      id: user.id,
      email: user.email,
      role: user.role.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
