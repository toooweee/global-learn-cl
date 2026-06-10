import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeletePositionCommand } from '@/modules/organization/position/application/commands/delete-position/delete-position.command';
import {
  POSITION_REPOSITORY,
  type PositionRepositoryPort,
} from '@/modules/organization/position/application/ports/position.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(DeletePositionCommand)
export class DeletePositionCommandHandler implements ICommandHandler<
  DeletePositionCommand,
  void
> {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private readonly repository: PositionRepositoryPort,
  ) {}

  async execute(command: DeletePositionCommand): Promise<void> {
    const option = await this.repository.findById(command.positionId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Position not found',
        404,
        'POSITION_NOT_FOUND',
      );
    }
    await this.repository.delete(option.unwrap());
  }
}
