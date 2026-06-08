import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { DeleteCourseQuestionCommand } from './delete-course-question.command';
import {
  COURSE_QUESTION_REPOSITORY,
  type CourseQuestionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(DeleteCourseQuestionCommand)
export class DeleteCourseQuestionCommandHandler implements ICommandHandler<
  DeleteCourseQuestionCommand,
  void
> {
  constructor(
    @Inject(COURSE_QUESTION_REPOSITORY)
    private readonly repository: CourseQuestionRepositoryPort,
  ) {}

  async execute(command: DeleteCourseQuestionCommand): Promise<void> {
    const option = await this.repository.findById(command.questionId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Question not found',
        404,
        'COURSE_QUESTION_NOT_FOUND',
      );
    }
    await this.repository.delete(command.questionId);
  }
}
