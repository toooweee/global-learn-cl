import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PromoteEmployeeCommand } from '@/modules/employee/application/promote-employee/promote-employee.command';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '@/modules/employee/application/ports/employee.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(PromoteEmployeeCommand)
export class PromoteEmployeeCommandHandler implements ICommandHandler<
  PromoteEmployeeCommand,
  void
> {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly repository: EmployeeRepositoryPort,
  ) {}

  async execute(command: PromoteEmployeeCommand): Promise<void> {
    const option = await this.repository.findById(command.id);
    if (option.isNone()) {
      throw new ApplicationException(
        'Employee not found',
        404,
        'EMPLOYEE_NOT_FOUND',
      );
    }

    const promoted = option.unwrap().promote(command.positionId);
    await this.repository.save(promoted);
  }
}
