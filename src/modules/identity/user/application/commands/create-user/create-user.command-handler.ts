import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '@/modules/identity/user/application/commands/create-user/create-user.command';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@/modules/identity/user/application/ports/user.repository.port';
import { Inject } from '@nestjs/common';
import { UserEntity } from '@/modules/identity/user/domain/user.entity';
import { PasswordService } from '@/libs/crypto/password.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: CreateUserCommand) {
    const { email, password, roleId } = command;

    const user = UserEntity.create({
      email,
      hashedPassword: await this.passwordService.hash(password),
      roleId,
    });

    await this.userRepository.transaction(async () => {
      const userOption = await this.userRepository.findByEmail(email);

      if (!userOption.isNone()) {
        throw new ApplicationException(
          'User already exists',
          409,
          'USER_ALREADY_EXISTS',
        );
      }

      await this.userRepository.save(user);
    });

    return user.id;
  }
}
