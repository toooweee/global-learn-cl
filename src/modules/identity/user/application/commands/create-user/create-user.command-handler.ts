import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '@/modules/identity/user/application/commands/create-user/create-user.command';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@/modules/identity/user/application/ports/user.repository.port';
import { Inject } from '@nestjs/common';
import { UserEntity } from '@/modules/identity/user/domain/user.entity';
import * as argon from 'argon2';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: CreateUserCommand) {
    const { email, password } = command;

    const user = UserEntity.create({
      email,
      hashedPassword: await argon.hash(password),
    });

    await this.userRepository.transaction(async () => {
      const userOption = await this.userRepository.findByEmail(email);

      if (!userOption.isNone()) {
        throw new ApplicationException(
          'User already exists',
          'USER_ALREADY_EXISTS',
          409,
        );
      }

      await this.userRepository.save(user);
    });

    return user.id;
  }
}
