import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { IdResponseDto } from '@/libs/api/dto';
import { CourseEntity } from '@/modules/education/course/domain/course.entity';
import { CreateCourseCommand } from './create-course.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(CreateCourseCommand)
export class CreateCourseCommandHandler implements ICommandHandler<
  CreateCourseCommand,
  IdResponseDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: CreateCourseCommand): Promise<IdResponseDto> {
    const authorId = RequestContextService.getUserId();
    if (!authorId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const course = CourseEntity.create({
      name: command.name,
      description: command.description,
      scope: command.scope,
      departmentId: command.departmentId,
      divisionId: command.divisionId,
      authorId,
      coverId: command.coverId,
    });

    await this.repository.save(course);
    return new IdResponseDto(course.id);
  }
}
