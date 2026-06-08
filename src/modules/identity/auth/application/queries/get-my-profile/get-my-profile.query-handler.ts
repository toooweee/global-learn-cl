import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { MyProfileResponseDto } from '@/modules/identity/auth/presentation/dto/my-profile.response.dto';
import { GetMyProfileQuery } from './get-my-profile.query';

@QueryHandler(GetMyProfileQuery)
export class GetMyProfileQueryHandler implements IQueryHandler<
  GetMyProfileQuery,
  MyProfileResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetMyProfileQuery): Promise<MyProfileResponseDto> {
    const user = await this.prismaService.client.user.findUnique({
      where: { id: query.userId },
      include: {
        role: true,
        employee: {
          include: {
            division: { include: { department: true } },
            position: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApplicationException('User not found', 404, 'USER_NOT_FOUND');
    }

    return new MyProfileResponseDto({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: { id: user.role.id, name: user.role.name },
      employee: user.employee
        ? {
            id: user.employee.id,
            fullname: user.employee.fullname,
            biography: user.employee.biography,
            employmentDate: user.employee.employmentDate,
            dismissalDate: user.employee.dismissalDate,
            avatarId: user.employee.avatarId,
            division: {
              id: user.employee.division.id,
              name: user.employee.division.name,
              department: {
                id: user.employee.division.department.id,
                name: user.employee.division.department.name,
              },
            },
            position: user.employee.position
              ? {
                  id: user.employee.position.id,
                  name: user.employee.position.name,
                }
              : null,
          }
        : null,
    });
  }
}
