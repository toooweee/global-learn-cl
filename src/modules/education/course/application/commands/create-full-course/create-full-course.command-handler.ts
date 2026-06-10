import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { CourseStatus } from '@/modules/education/course/course.types';
import { IdResponseDto } from '@/libs/api/dto';
import { CourseEntity } from '@/modules/education/course/domain/course.entity';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';
import { CreateFullCourseCommand } from './create-full-course.command';

@CommandHandler(CreateFullCourseCommand)
export class CreateFullCourseCommandHandler implements ICommandHandler<
  CreateFullCourseCommand,
  IdResponseDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: CreateFullCourseCommand): Promise<IdResponseDto> {
    const authorId = RequestContextService.getUserId();
    if (!authorId) {
      throw new ApplicationException('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const isAdmin = RequestContextService.getUserRole() === 'admin';
    const course = CourseEntity.create({
      name: command.name,
      description: command.description ?? '',
      scope: command.scope,
      departmentId: command.departmentId,
      divisionId: command.divisionId,
      authorId,
      coverId: command.coverId,
      status: isAdmin ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
    });

    for (const mod of command.modules) {
      const moduleId = course.addModule({ name: mod.name });
      for (const step of mod.steps ?? []) {
        course.addStep({
          moduleId,
          name: step.name,
          type: step.type,
          lessonId: step.lessonId,
          testId: step.testId,
        });
      }
    }

    await this.repository.save(course);
    return new IdResponseDto(course.id);
  }
}
