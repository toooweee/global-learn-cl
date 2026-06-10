import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PromoteEmployeeCommand } from '@/modules/employee/application/promote-employee/promote-employee.command';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '@/modules/employee/application/ports/employee.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { NotificationService } from '@/modules/notifications/notification.service';
import { MailService } from '@/modules/mail/mail.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { roleFromPositionName } from '@/libs/auth/roles.constants';

@CommandHandler(PromoteEmployeeCommand)
export class PromoteEmployeeCommandHandler implements ICommandHandler<
  PromoteEmployeeCommand,
  void
> {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly repository: EmployeeRepositoryPort,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: PromoteEmployeeCommand): Promise<void> {
    const option = await this.repository.findById(command.employeeId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Employee not found',
        404,
        'EMPLOYEE_NOT_FOUND',
      );
    }

    const promoted = option.unwrap().promote(command.positionId);
    await this.repository.save(promoted);

    const { fullname } = promoted.getProps();
    const employeeId = command.employeeId;

    // Update the user's role to match the new position
    const [position] = await Promise.all([
      this.prismaService.client.position.findUnique({
        where: { id: command.positionId },
        select: { name: true },
      }),
    ]);
    const newRoleName = roleFromPositionName(position?.name);
    const newRole = await this.prismaService.client.role.findUnique({
      where: { name: newRoleName },
    });
    if (newRole) {
      await this.prismaService.client.user.update({
        where: { id: employeeId },
        data: { roleId: newRole.id },
      });
    }

    this.notificationService
      .notify(employeeId, 'EMPLOYEE_PROMOTED', {
        positionId: command.positionId,
      })
      .catch(() => undefined);

    Promise.all([
      this.prismaService.client.user.findUnique({
        where: { id: employeeId },
        select: { email: true },
      }),
      this.prismaService.client.position.findUnique({
        where: { id: command.positionId },
        select: { name: true },
      }),
    ])
      .then(([user, position]) => {
        if (user?.email && position) {
          return this.mailService.sendEmployeePromoted(user.email, {
            fullname,
            positionName: position.name,
          });
        }
      })
      .catch(() => undefined);
  }
}
