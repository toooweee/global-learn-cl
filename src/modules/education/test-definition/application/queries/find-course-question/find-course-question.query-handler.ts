import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CourseQuestionResponseDto } from '@/modules/education/test-definition/presentation/dto/test-definition.response.dto';
import { FindCourseQuestionQuery } from './find-course-question.query';

@QueryHandler(FindCourseQuestionQuery)
export class FindCourseQuestionQueryHandler implements IQueryHandler<
  FindCourseQuestionQuery,
  CourseQuestionResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindCourseQuestionQuery,
  ): Promise<CourseQuestionResponseDto> {
    const row = await this.prismaService.client.courseQuestion.findUnique({
      where: { id: query.questionId },
      include: {
        answers: true,
        _count: { select: { testQuestions: true } },
      },
    });

    if (!row) {
      throw new ApplicationException(
        'Question not found',
        404,
        'QUESTION_NOT_FOUND',
      );
    }

    return new CourseQuestionResponseDto({
      id: row.id,
      question: row.question,
      courseId: row.courseId,
      moduleId: row.moduleId,
      usedInTestsCount: row._count.testQuestions,
      answers: row.answers.map((a) => ({
        id: a.id,
        answer: a.answer,
        isCorrect: a.isCorrect,
      })),
    });
  }
}
