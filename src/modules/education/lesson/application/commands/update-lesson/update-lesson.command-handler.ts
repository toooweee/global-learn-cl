import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { UpdateLessonCommand } from './update-lesson.command';
import {
  LESSON_REPOSITORY,
  type LessonRepositoryPort,
} from '@/modules/education/lesson/application/ports/lesson.repository.port';

@CommandHandler(UpdateLessonCommand)
export class UpdateLessonCommandHandler implements ICommandHandler<
  UpdateLessonCommand,
  void
> {
  constructor(
    @Inject(LESSON_REPOSITORY)
    private readonly repository: LessonRepositoryPort,
  ) {}

  async execute(command: UpdateLessonCommand): Promise<void> {
    const option = await this.repository.findById(command.lessonId);
    if (option.isNone()) {
      throw new ApplicationException(
        'Lesson not found',
        404,
        'LESSON_NOT_FOUND',
      );
    }
    const lesson = option.unwrap();
    lesson.update({ name: command.name, content: command.content });
    await this.repository.save(lesson);
  }
}
