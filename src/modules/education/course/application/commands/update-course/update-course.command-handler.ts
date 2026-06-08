import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { UpdateCourseCommand } from './update-course.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(UpdateCourseCommand)
export class UpdateCourseCommandHandler implements ICommandHandler<
  UpdateCourseCommand,
  void
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: UpdateCourseCommand): Promise<void> {
    const option = await this.repository.findById(command.courseId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const course = option.unwrap();
    course.updateMetadata({
      name: command.name,
      description: command.description,
      coverId: command.coverId,
    });

    await this.repository.save(course);
  }
}
