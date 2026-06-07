import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateDivisionCommand } from '@/modules/organization/division/application/commands/create-division/create-division.command';
import {
  DIVISION_REPOSITORY,
  type DivisionRepositoryPort,
} from '@/modules/organization/division/application/ports/division.repository.port';
import { DivisionEntity } from '@/modules/organization/division/domain/division.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(CreateDivisionCommand)
export class CreateDivisionCommandHandler implements ICommandHandler<
  CreateDivisionCommand,
  string
> {
  constructor(
    @Inject(DIVISION_REPOSITORY)
    private readonly repository: DivisionRepositoryPort,
  ) {}

  async execute(command: CreateDivisionCommand): Promise<string> {
    const existing = await this.repository.findByName(command.name);
    if (existing) {
      throw new ApplicationException(
        'Division already exists',
        409,
        'DIVISION_ALREADY_EXISTS',
      );
    }

    const entity = DivisionEntity.create({
      name: command.name,
      departmentId: command.departmentId,
    });
    await this.repository.save(entity);
    return entity.id;
  }
}
