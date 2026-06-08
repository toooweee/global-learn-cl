import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { DeleteCourseCommand } from './delete-course.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(DeleteCourseCommand)
export class DeleteCourseCommandHandler implements ICommandHandler<
  DeleteCourseCommand,
  void
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: DeleteCourseCommand): Promise<void> {
    const option = await this.repository.findById(command.courseId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }
    await this.repository.delete(command.courseId);
  }
}
