import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreatePositionCommand } from '@/modules/organization/position/application/commands/create-position/create-position.command';
import {
  POSITION_REPOSITORY,
  type PositionRepositoryPort,
} from '@/modules/organization/position/application/ports/position.repository.port';
import { PositionEntity } from '@/modules/organization/position/domain/position.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreatePositionCommand)
export class CreatePositionCommandHandler implements ICommandHandler<
  CreatePositionCommand,
  string
> {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private readonly repository: PositionRepositoryPort,
  ) {}

  async execute(command: CreatePositionCommand): Promise<string> {
    const existing = await this.repository.findByName(command.name);
    if (existing) {
      throw new ApplicationException(
        'Position already exists',
        409,
        'POSITION_ALREADY_EXISTS',
      );
    }

    const entity = PositionEntity.create({
      name: command.name,
      parentId: command.parentId,
    });
    await this.repository.save(entity);
    return entity.id;
  }
}
