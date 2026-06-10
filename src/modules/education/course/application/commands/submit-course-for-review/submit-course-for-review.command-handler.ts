import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { SubmitCourseForReviewCommand } from './submit-course-for-review.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(SubmitCourseForReviewCommand)
export class SubmitCourseForReviewCommandHandler implements ICommandHandler<
  SubmitCourseForReviewCommand,
  void
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: SubmitCourseForReviewCommand): Promise<void> {
    const found = await this.repository.findById(command.courseId);
    if (found.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }
    const course = found.unwrap();
    const authorId = RequestContextService.getUserId();
    const isAdmin = RequestContextService.getUserRole() === 'admin';
    if (!isAdmin && course.getProps().authorId !== authorId) {
      throw new ApplicationException('Forbidden', 403, 'FORBIDDEN');
    }
    course.submitForReview();
    await this.repository.save(course);
  }
}
