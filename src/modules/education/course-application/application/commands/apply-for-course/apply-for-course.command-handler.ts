import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { IdResponseDto } from '@/libs/api/dto';
import { CourseApplicationEntity } from '@/modules/education/course-application/domain/course-application.entity';
import { ApplyForCourseCommand } from './apply-for-course.command';
import {
  COURSE_APPLICATION_REPOSITORY,
  type CourseApplicationRepositoryPort,
} from '@/modules/education/course-application/application/ports/course-application.repository.port';

@CommandHandler(ApplyForCourseCommand)
export class ApplyForCourseCommandHandler implements ICommandHandler<
  ApplyForCourseCommand,
  IdResponseDto
> {
  constructor(
    @Inject(COURSE_APPLICATION_REPOSITORY)
    private readonly repository: CourseApplicationRepositoryPort,
  ) {}

  async execute(command: ApplyForCourseCommand): Promise<IdResponseDto> {
    const employeeId = RequestContextService.getUserId();
    if (!employeeId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const existing = await this.repository.findByCourseAndEmployee(
      command.courseId,
      employeeId,
    );
    if (existing.isSome()) {
      throw new ApplicationException(
        'Application already exists',
        409,
        'COURSE_APPLICATION_ALREADY_EXISTS',
      );
    }

    const application = CourseApplicationEntity.create({
      courseId: command.courseId,
      employeeId,
    });

    await this.repository.save(application);
    return new IdResponseDto(application.id);
  }
}
