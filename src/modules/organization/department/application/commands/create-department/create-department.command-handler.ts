import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateDepartmentCommand } from '@/modules/organization/department/application/commands/create-department/create-department.command';
import {
  DEPARTMENT_REPOSITORY,
  type DepartmentRepositoryPort,
} from '@/modules/organization/department/application/ports/department.repository.port';
import { DepartmentEntity } from '@/modules/organization/department/domain/department.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreateDepartmentCommand)
export class CreateDepartmentCommandHandler implements ICommandHandler<
  CreateDepartmentCommand,
  string
> {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly repository: DepartmentRepositoryPort,
  ) {}

  async execute(command: CreateDepartmentCommand): Promise<string> {
    const existing = await this.repository.findByName(command.name);
    if (existing) {
      throw new ApplicationException(
        'Department already exists',
        409,
        'DEPARTMENT_ALREADY_EXISTS',
      );
    }

    const entity = DepartmentEntity.create({ name: command.name });
    await this.repository.save(entity);
    return entity.id;
  }
}
