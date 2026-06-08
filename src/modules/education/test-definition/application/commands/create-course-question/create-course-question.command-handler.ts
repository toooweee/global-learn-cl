import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IdResponseDto } from '@/libs/api/dto';
import { CourseQuestionEntity } from '@/modules/education/test-definition/domain/course-question.entity';
import { CreateCourseQuestionCommand } from './create-course-question.command';
import {
  COURSE_QUESTION_REPOSITORY,
  type CourseQuestionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(CreateCourseQuestionCommand)
export class CreateCourseQuestionCommandHandler implements ICommandHandler<
  CreateCourseQuestionCommand,
  IdResponseDto
> {
  constructor(
    @Inject(COURSE_QUESTION_REPOSITORY)
    private readonly repository: CourseQuestionRepositoryPort,
  ) {}

  async execute(command: CreateCourseQuestionCommand): Promise<IdResponseDto> {
    const question = CourseQuestionEntity.create({
      courseId: command.courseId,
      moduleId: command.moduleId,
      question: command.question,
      answers: command.answers,
    });
    await this.repository.save(question);
    return new IdResponseDto(question.id);
  }
}
