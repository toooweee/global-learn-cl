import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteDepartmentCommand } from '@/modules/organization/department/application/commands/delete-department/delete-department.command';
import {
  DEPARTMENT_REPOSITORY,
  type DepartmentRepositoryPort,
} from '@/modules/organization/department/application/ports/department.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(DeleteDepartmentCommand)
export class DeleteDepartmentCommandHandler implements ICommandHandler<
  DeleteDepartmentCommand,
  void
> {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly repository: DepartmentRepositoryPort,
  ) {}

  async execute(command: DeleteDepartmentCommand): Promise<void> {
    const option = await this.repository.findById(command.departmentId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Department not found',
        404,
        'DEPARTMENT_NOT_FOUND',
      );
    }
    await this.repository.delete(option.unwrap());
  }
}
