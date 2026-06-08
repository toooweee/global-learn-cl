import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { IdResponseDto } from '@/libs/api/dto';
import { AddStepCommand } from './add-step.command';
import {
  COURSE_REPOSITORY,
  type CourseRepositoryPort,
} from '@/modules/education/course/application/ports/course.repository.port';

@CommandHandler(AddStepCommand)
export class AddStepCommandHandler implements ICommandHandler<
  AddStepCommand,
  IdResponseDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepositoryPort,
  ) {}

  async execute(command: AddStepCommand): Promise<IdResponseDto> {
    const option = await this.repository.findById(command.courseId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Course not found',
        404,
        'COURSE_NOT_FOUND',
      );
    }

    const course = option.unwrap();
    const stepId = course.addStep({
      moduleId: command.moduleId,
      name: command.name,
      type: command.type,
      lessonId: command.lessonId,
      testId: command.testId,
    });
    await this.repository.save(course);
    return new IdResponseDto(stepId);
  }
}
