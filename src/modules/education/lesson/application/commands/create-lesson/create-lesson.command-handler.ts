import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IdResponseDto } from '@/libs/api/dto';
import { LessonEntity } from '@/modules/education/lesson/domain/lesson.entity';
import { CreateLessonCommand } from './create-lesson.command';
import {
  LESSON_REPOSITORY,
  type LessonRepositoryPort,
} from '@/modules/education/lesson/application/ports/lesson.repository.port';

@CommandHandler(CreateLessonCommand)
export class CreateLessonCommandHandler implements ICommandHandler<
  CreateLessonCommand,
  IdResponseDto
> {
  constructor(
    @Inject(LESSON_REPOSITORY)
    private readonly repository: LessonRepositoryPort,
  ) {}

  async execute(command: CreateLessonCommand): Promise<IdResponseDto> {
    const lesson = LessonEntity.create({
      name: command.name,
      content: command.content,
    });
    await this.repository.save(lesson);
    return new IdResponseDto(lesson.id);
  }
}
