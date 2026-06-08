import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { LessonResponseDto } from '@/modules/education/lesson/presentation/dto/lesson.response.dto';
import { FindLessonQuery } from './find-lesson.query';

@QueryHandler(FindLessonQuery)
export class FindLessonQueryHandler implements IQueryHandler<
  FindLessonQuery,
  LessonResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: FindLessonQuery): Promise<LessonResponseDto> {
    const row = await this.prismaService.client.lesson.findUnique({
      where: { id: query.lessonId },
    });
    if (!row) {
      throw new ApplicationException(
        'Lesson not found',
        404,
        'LESSON_NOT_FOUND',
      );
    }
    return new LessonResponseDto({
      id: row.id,
      name: row.name,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? undefined,
    });
  }
}
