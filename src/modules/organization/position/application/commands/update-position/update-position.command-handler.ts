import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdatePositionCommand } from '@/modules/organization/position/application/commands/update-position/update-position.command';
import {
  POSITION_REPOSITORY,
  type PositionRepositoryPort,
} from '@/modules/organization/position/application/ports/position.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PositionEntity } from '@/modules/organization/position/domain/position.entity';

@CommandHandler(UpdatePositionCommand)
export class UpdatePositionCommandHandler implements ICommandHandler<
  UpdatePositionCommand,
  void
> {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private readonly repository: PositionRepositoryPort,
  ) {}

  async execute(command: UpdatePositionCommand): Promise<void> {
    const option = await this.repository.findById(command.id);
    if (option.isNone()) {
      throw new ApplicationException(
        'Position not found',
        404,
        'POSITION_NOT_FOUND',
      );
    }

    const props = option.unwrap().getProps();
    const updated = PositionEntity.recreate({
      id: props.id,
      props: {
        ...props,
        name: command.name,
        parentId:
          command.parentId !== undefined ? command.parentId : props.parentId,
        updatedAt: new Date(),
      },
    });

    await this.repository.save(updated);
  }
}
