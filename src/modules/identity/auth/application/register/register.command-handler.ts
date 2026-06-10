import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { RegisterCommand } from '@/modules/identity/auth/application/register/register.command';
import { CreateEmployeeCommand } from '@/modules/employee/application/create-employee/create-employee.command';

@CommandHandler(RegisterCommand)
@Injectable()
export class RegisterCommandHandler implements ICommandHandler<
  RegisterCommand,
  string
> {
  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: RegisterCommand): Promise<string> {
    return this.commandBus.execute<CreateEmployeeCommand, string>(
      new CreateEmployeeCommand({
        email: command.email,
        fullname: command.fullname,
        divisionId: command.divisionId,
        employmentDate: command.employmentDate,
        positionId: command.positionId,
      }),
    );
  }
}
