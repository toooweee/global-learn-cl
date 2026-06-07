import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteDivisionCommand } from '@/modules/organization/division/application/commands/delete-division/delete-division.command';
import {
  DIVISION_REPOSITORY,
  type DivisionRepositoryPort,
} from '@/modules/organization/division/application/ports/division.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(DeleteDivisionCommand)
export class DeleteDivisionCommandHandler implements ICommandHandler<
  DeleteDivisionCommand,
  void
> {
  constructor(
    @Inject(DIVISION_REPOSITORY)
    private readonly repository: DivisionRepositoryPort,
  ) {}

  async execute(command: DeleteDivisionCommand): Promise<void> {
    const option = await this.repository.findById(command.id);
    if (option.isNone()) {
      throw new ApplicationException(
        'Division not found',
        404,
        'DIVISION_NOT_FOUND',
      );
    }
    await this.repository.delete(option.unwrap());
  }
}
