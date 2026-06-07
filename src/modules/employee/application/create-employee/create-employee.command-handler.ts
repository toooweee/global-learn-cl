import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateEmployeeCommand } from '@/modules/employee/application/create-employee/create-employee.command';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '@/modules/employee/application/ports/employee.repository.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@/modules/identity/user/application/ports/user.repository.port';
import { EmployeeEntity } from '@/modules/employee/domain/employee.entity';
import { UserEntity } from '@/modules/identity/user/domain/user.entity';
import { PasswordService } from '@/libs/crypto/password.service';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeCommandHandler implements ICommandHandler<
  CreateEmployeeCommand,
  string
> {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: CreateEmployeeCommand): Promise<string> {
    const {
      email,
      password,
      roleId,
      fullname,
      divisionId,
      employmentDate,
      positionId,
    } = command;

    return this.employeeRepository.transaction(async () => {
      const existing = await this.userRepository.findByEmail(email);
      if (existing.isSome()) {
        throw new ApplicationException(
          'User already exists',
          409,
          'USER_ALREADY_EXISTS',
        );
      }

      const user = UserEntity.create({
        email,
        hashedPassword: await this.passwordService.hash(password),
        roleId,
      });
      await this.userRepository.save(user);

      const employee = EmployeeEntity.create({
        id: user.id,
        fullname,
        divisionId,
        employmentDate,
        positionId: positionId ?? null,
      });
      await this.employeeRepository.save(employee);

      return user.id;
    });
  }
}
