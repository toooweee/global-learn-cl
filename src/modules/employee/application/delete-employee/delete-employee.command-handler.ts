import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteEmployeeCommand } from '@/modules/employee/application/delete-employee/delete-employee.command';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '@/modules/employee/application/ports/employee.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(DeleteEmployeeCommand)
export class DeleteEmployeeCommandHandler implements ICommandHandler<
  DeleteEmployeeCommand,
  void
> {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly repository: EmployeeRepositoryPort,
  ) {}

  async execute(command: DeleteEmployeeCommand): Promise<void> {
    const option = await this.repository.findById(command.id);
    if (option.isNone()) {
      throw new ApplicationException(
        'Employee not found',
        404,
        'EMPLOYEE_NOT_FOUND',
      );
    }

    const dismissed = option.unwrap().dismiss();
    await this.repository.save(dismissed);
  }
}
