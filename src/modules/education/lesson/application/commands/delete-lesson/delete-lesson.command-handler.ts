import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { DeleteLessonCommand } from './delete-lesson.command';
import {
  LESSON_REPOSITORY,
  type LessonRepositoryPort,
} from '@/modules/education/lesson/application/ports/lesson.repository.port';

@CommandHandler(DeleteLessonCommand)
export class DeleteLessonCommandHandler implements ICommandHandler<
  DeleteLessonCommand,
  void
> {
  constructor(
    @Inject(LESSON_REPOSITORY)
    private readonly repository: LessonRepositoryPort,
  ) {}

  async execute(command: DeleteLessonCommand): Promise<void> {
    const option = await this.repository.findById(command.lessonId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Lesson not found',
        404,
        'LESSON_NOT_FOUND',
      );
    }
    await this.repository.delete(command.lessonId);
  }
}
