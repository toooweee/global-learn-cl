import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateEmployeeCommand } from '@/modules/employee/application/update-employee/update-employee.command';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '@/modules/employee/application/ports/employee.repository.port';
import { EmployeeEntity } from '@/modules/employee/domain/employee.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(UpdateEmployeeCommand)
export class UpdateEmployeeCommandHandler implements ICommandHandler<
  UpdateEmployeeCommand,
  void
> {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly repository: EmployeeRepositoryPort,
  ) {}

  async execute(command: UpdateEmployeeCommand): Promise<void> {
    const option = await this.repository.findById(command.id);
    if (option.isNone()) {
      throw new ApplicationException(
        'Employee not found',
        404,
        'EMPLOYEE_NOT_FOUND',
      );
    }

    const props = option.unwrap().getProps();
    const updated = EmployeeEntity.recreate({
      id: props.id,
      props: {
        ...props,
        fullname: command.fullname ?? props.fullname,
        biography:
          command.biography !== undefined ? command.biography : props.biography,
        divisionId: command.divisionId ?? props.divisionId,
        positionId:
          command.positionId !== undefined
            ? command.positionId
            : props.positionId,
        avatarId:
          command.avatarId !== undefined ? command.avatarId : props.avatarId,
        updatedAt: new Date(),
      },
    });

    await this.repository.save(updated);
  }
}
