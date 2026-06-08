import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RemoveStepCommand } from './remove-step.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(RemoveStepCommand)
export class RemoveStepCommandHandler implements ICommandHandler<
  RemoveStepCommand,
  void
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: RemoveStepCommand): Promise<void> {
    const option = await this.repository.findById(command.courseId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const course = option.unwrap();
    course.removeStep(command.moduleId, command.stepId);
    await this.repository.save(course);
  }
}
