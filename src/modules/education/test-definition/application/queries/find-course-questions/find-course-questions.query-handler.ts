import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CourseQuestionResponseDto } from '@/modules/education/test-definition/presentation/dto/test-definition.response.dto';
import { FindCourseQuestionsQuery } from './find-course-questions.query';

@QueryHandler(FindCourseQuestionsQuery)
export class FindCourseQuestionsQueryHandler implements IQueryHandler<
  FindCourseQuestionsQuery,
  CourseQuestionResponseDto[]
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindCourseQuestionsQuery,
  ): Promise<CourseQuestionResponseDto[]> {
    const rows = await this.prismaService.client.courseQuestion.findMany({
      where: { courseId: query.courseId },
      include: { answers: true },
      orderBy: { id: 'asc' },
    });

    return rows.map(
      (row) =>
        new CourseQuestionResponseDto({
          id: row.id,
          question: row.question,
          courseId: row.courseId,
          moduleId: row.moduleId,
          answers: row.answers.map((a) => ({
            id: a.id,
            answer: a.answer,
            isCorrect: a.isCorrect,
          })),
        }),
    );
  }
}
