import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
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
import { PrismaService } from '@/infra/prisma/prisma.service';
import { MailService } from '@/modules/mail/mail.service';
import { EnvService } from '@/infra/env/env.service';
import { roleFromPositionName } from '@/libs/auth/roles.constants';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly envService: EnvService,
  ) {}

  async execute(command: CreateEmployeeCommand): Promise<string> {
    const { email, fullname, divisionId, employmentDate, positionId } = command;

    const rawToken = randomBytes(32).toString('hex');
    let userId: string;

    await this.employeeRepository.transaction(async () => {
      const existing = await this.userRepository.findByEmail(email);
      if (existing.isSome()) {
        throw new ApplicationException(
          'User already exists',
          409,
          'USER_ALREADY_EXISTS',
        );
      }

      // Derive role from position — no explicit roleId from caller
      const position = positionId
        ? await this.prismaService.client.position.findUnique({
            where: { id: positionId },
            select: { name: true },
          })
        : null;
      const roleName = roleFromPositionName(position?.name);
      const role = await this.prismaService.client.role.findUniqueOrThrow({
        where: { name: roleName },
      });

      // Random placeholder password — cannot be guessed or used for login
      const placeholderHash = await this.passwordService.hash(
        randomUUID() + randomBytes(16).toString('hex'),
      );

      const user = UserEntity.create({
        email,
        hashedPassword: placeholderHash,
        roleId: role.id,
      });
      await this.userRepository.save(user);
      userId = user.id;

      const hashedToken = await this.passwordService.hash(rawToken);
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

      await this.prismaService.client.user.update({
        where: { id: userId },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const employee = EmployeeEntity.create({
        id: userId,
        fullname,
        divisionId,
        employmentDate,
        positionId: positionId ?? null,
      });
      await this.employeeRepository.save(employee);
    });

    const appUrl = this.envService.get('APP_URL');
    const inviteLink = `${appUrl}/complete-registration?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await this.mailService.sendEmployeeInvite(email, { fullname, inviteLink });

    return userId!;
  }
}
