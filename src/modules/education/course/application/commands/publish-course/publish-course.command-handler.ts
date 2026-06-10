import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PublishCourseCommand } from './publish-course.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';
import { NotificationService } from '@/modules/notifications/notification.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

@CommandHandler(PublishCourseCommand)
export class PublishCourseCommandHandler implements ICommandHandler<
  PublishCourseCommand,
  void
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
    private readonly notificationService: NotificationService,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: PublishCourseCommand): Promise<void> {
    const found = await this.repository.findById(command.courseId);
    if (found.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }
    const course = found.unwrap();
    course.publish();
    await this.repository.save(course);

    const { authorId, name } = course.getProps();
    this.notificationService
      .notify(authorId, 'COURSE_PUBLISHED', {
        courseId: course.id,
        courseName: name,
      })
      .catch(() => undefined);
  }
}
