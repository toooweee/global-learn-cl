import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { IdResponseDto } from '@/libs/api/dto';
import { AddModuleCommand } from './add-module.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(AddModuleCommand)
export class AddModuleCommandHandler implements ICommandHandler<
  AddModuleCommand,
  IdResponseDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: AddModuleCommand): Promise<IdResponseDto> {
    const option = await this.repository.findById(command.courseId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const course = option.unwrap();
    const moduleId = course.addModule({ name: command.name });
    await this.repository.save(course);
    return new IdResponseDto(moduleId);
  }
}
