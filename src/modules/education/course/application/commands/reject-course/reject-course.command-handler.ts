import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RejectCourseCommand } from './reject-course.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';
import { NotificationService } from '@/modules/notifications/notification.service';

@CommandHandler(RejectCourseCommand)
export class RejectCourseCommandHandler implements ICommandHandler<
  RejectCourseCommand,
  void
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: RejectCourseCommand): Promise<void> {
    const found = await this.repository.findById(command.courseId);
    if (found.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }
    const course = found.unwrap();
    course.reject(command.note);
    await this.repository.save(course);

    const { authorId, name } = course.getProps();
    this.notificationService
      .notify(authorId, 'COURSE_REJECTED', {
        courseId: course.id,
        courseName: name,
        note: command.note,
      })
      .catch(() => undefined);
  }
}
