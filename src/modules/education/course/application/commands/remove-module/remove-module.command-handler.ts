import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RemoveModuleCommand } from './remove-module.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(RemoveModuleCommand)
export class RemoveModuleCommandHandler implements ICommandHandler<
  RemoveModuleCommand,
  void
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: RemoveModuleCommand): Promise<void> {
    const option = await this.repository.findById(command.courseId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const course = option.unwrap();
    course.removeModule(command.moduleId);
    await this.repository.save(course);
  }
}
