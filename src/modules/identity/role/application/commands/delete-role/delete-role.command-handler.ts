import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteRoleCommand } from '@/modules/identity/role/application/commands/delete-role/delete-role.command';
import {
  ROLE_REPOSITORY,
  type RoleRepositoryPort,
} from '@/modules/identity/role/application/ports/role.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleCommandHandler implements ICommandHandler<
  DeleteRoleCommand,
  void
> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly repository: RoleRepositoryPort,
  ) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    const option = await this.repository.findById(command.roleId);
    if (option.isNone()) {
      throw new ApplicationException('Role not found', 404, 'ROLE_NOT_FOUND');
    }
    await this.repository.delete(option.unwrap());
  }
}
