import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { IdResponseDto } from '@/libs/api/dto';
import { EnrollmentEntity } from '@/modules/education/enrollment/domain/enrollment.entity';
import { CreateEnrollmentCommand } from './create-enrollment.command';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepositoryPort,
} from '@/modules/education/enrollment/application/ports/enrollment.repository.port';

@CommandHandler(CreateEnrollmentCommand)
export class CreateEnrollmentCommandHandler implements ICommandHandler<
  CreateEnrollmentCommand,
  IdResponseDto
> {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly repository: EnrollmentRepositoryPort,
  ) {}

  async execute(command: CreateEnrollmentCommand): Promise<IdResponseDto> {
    const existing = await this.repository.findByCourseAndEmployee(
      command.courseId,
      command.employeeId,
    );
    if (existing.isSome()) {
      throw new ApplicationException(
        'Enrollment already exists',
        409,
        'ENROLLMENT_ALREADY_EXISTS',
      );
    }

    const enrollment = EnrollmentEntity.create({
      courseId: command.courseId,
      employeeId: command.employeeId,
      assignedById: command.assignedById,
    });

    await this.repository.save(enrollment);
    return new IdResponseDto(enrollment.id);
  }
}
