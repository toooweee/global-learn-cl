import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateDepartmentCommand } from '@/modules/organization/department/application/commands/update-department/update-department.command';
import {
  DEPARTMENT_REPOSITORY,
  type DepartmentRepositoryPort,
} from '@/modules/organization/department/application/ports/department.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';

@CommandHandler(UpdateDepartmentCommand)
export class UpdateDepartmentCommandHandler implements ICommandHandler<
  UpdateDepartmentCommand,
  void
> {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly repository: DepartmentRepositoryPort,
  ) {}

  async execute(command: UpdateDepartmentCommand): Promise<void> {
    const option = await this.repository.findById(command.departmentId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Department not found',
        404,
        'DEPARTMENT_NOT_FOUND',
      );
    }

    const entity = option.unwrap();
    const props = entity.getProps();

    const updated = DepartmentEntity.recreate({
      id: props.id,
      props: { ...props, name: command.name, updatedAt: new Date() },
    });

    await this.repository.save(updated);
  }
}
