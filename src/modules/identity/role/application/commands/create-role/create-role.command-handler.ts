import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateRoleCommand } from '@/modules/identity/role/application/commands/create-role/create-role.command';
import {
  ROLE_REPOSITORY,
  type RoleRepositoryPort,
} from '@/modules/identity/role/application/ports/role.repository.port';
import { RoleEntity } from '@/modules/identity/role/domain/role.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreateRoleCommand)
export class CreateRoleCommandHandler implements ICommandHandler<
  CreateRoleCommand,
  string
> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly repository: RoleRepositoryPort,
  ) {}

  async execute(command: CreateRoleCommand): Promise<string> {
    const existing = await this.repository.findByName(command.name);
    if (existing) {
      throw new ApplicationException(
        'Role already exists',
        409,
        'ROLE_ALREADY_EXISTS',
      );
    }

    const entity = RoleEntity.create({ name: command.name });
    await this.repository.save(entity);
    return entity.id;
  }
}
