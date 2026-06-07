import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateDivisionCommand } from '@/modules/organization/division/application/commands/update-division/update-division.command';
import {
  DIVISION_REPOSITORY,
  type DivisionRepositoryPort,
} from '@/modules/organization/division/application/ports/division.repository.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';

@CommandHandler(UpdateDivisionCommand)
export class UpdateDivisionCommandHandler implements ICommandHandler<
  UpdateDivisionCommand,
  void
> {
  constructor(
    @Inject(DIVISION_REPOSITORY)
    private readonly repository: DivisionRepositoryPort,
  ) {}

  async execute(command: UpdateDivisionCommand): Promise<void> {
    const option = await this.repository.findById(command.divisionId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Division not found',
        404,
        'DIVISION_NOT_FOUND',
      );
    }

    const props = option.unwrap().getProps();
    const updated = DivisionEntity.recreate({
      id: props.id,
      props: {
        ...props,
        name: command.name,
        departmentId: command.departmentId,
        updatedAt: new Date(),
      },
    });

    await this.repository.save(updated);
  }
}
