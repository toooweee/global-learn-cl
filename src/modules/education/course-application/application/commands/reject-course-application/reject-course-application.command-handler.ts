import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RejectCourseApplicationCommand } from './reject-course-application.command';
import {
  COURSE_APPLICATION_REPOSITORY,
  type CourseApplicationRepositoryPort,
} from '@/modules/education/course-application/application/ports/course-application.repository.port';

@CommandHandler(RejectCourseApplicationCommand)
export class RejectCourseApplicationCommandHandler implements ICommandHandler<
  RejectCourseApplicationCommand,
  void
> {
  constructor(
    @Inject(COURSE_APPLICATION_REPOSITORY)
    private readonly repository: CourseApplicationRepositoryPort,
  ) {}

  async execute(command: RejectCourseApplicationCommand): Promise<void> {
    const option = await this.repository.findById(command.applicationId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Application not found',
        404,
        'COURSE_APPLICATION_NOT_FOUND',
      );
    }

    const application = option.unwrap();
    application.reject();
    await this.repository.save(application);
  }
}
