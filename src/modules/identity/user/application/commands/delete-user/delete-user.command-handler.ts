import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from '@/modules/identity/user/application/commands/delete-user/delete-user.command';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@/modules/identity/user/application/ports/user.repository.port';
import { Inject } from '@nestjs/common';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const userOption = await this.userRepository.findById(command.userId);

    if (userOption.isNone()) {
      throw new ApplicationException(
        `User with id ${command.userId} not found`,
        404,
        'USER_NOT_FOUND',
      );
    }

    await this.userRepository.delete(userOption.unwrap());
  }
}
