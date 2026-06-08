import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { UpdateCourseQuestionCommand } from './update-course-question.command';
import {
  COURSE_QUESTION_REPOSITORY,
  type CourseQuestionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@CommandHandler(UpdateCourseQuestionCommand)
export class UpdateCourseQuestionCommandHandler implements ICommandHandler<
  UpdateCourseQuestionCommand,
  void
> {
  constructor(
    @Inject(COURSE_QUESTION_REPOSITORY)
    private readonly repository: CourseQuestionRepositoryPort,
  ) {}

  async execute(command: UpdateCourseQuestionCommand): Promise<void> {
    const option = await this.repository.findById(command.questionId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Course question not found',
        404,
        'COURSE_QUESTION_NOT_FOUND',
      );
    }

    const question = option.unwrap();

    if (command.question !== undefined) {
      question.updateQuestion(command.question);
    }

    if (command.answers !== undefined) {
      const existing = question.getAnswers();
      for (const a of existing) {
        question.removeAnswer(a.id);
      }
      for (const a of command.answers) {
        question.addAnswer(a.answer, a.isCorrect);
      }
    }

    await this.repository.save(question);
  }
}
