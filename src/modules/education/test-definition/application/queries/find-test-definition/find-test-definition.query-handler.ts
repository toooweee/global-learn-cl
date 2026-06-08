import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  TestDefinitionResponseDto,
  CourseQuestionResponseDto,
} from '@/modules/education/test-definition/presentation/dto/test-definition.response.dto';
import { FindTestDefinitionQuery } from './find-test-definition.query';

@QueryHandler(FindTestDefinitionQuery)
export class FindTestDefinitionQueryHandler implements IQueryHandler<
  FindTestDefinitionQuery,
  TestDefinitionResponseDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: FindTestDefinitionQuery,
  ): Promise<TestDefinitionResponseDto> {
    const row = await this.prismaService.client.test.findUnique({
      where: { id: query.testId },
      include: {
        questions: {
          include: { question: { include: { answers: true } } },
        },
      },
    });

    if (!row) {
      throw new ApplicationException('Test not found', 404, 'TEST_NOT_FOUND');
    }

    return new TestDefinitionResponseDto({
      id: row.id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      name: row.name,
      passingPercent: row.passingPercent,
      questions: row.questions.map(
        (tq) =>
          new CourseQuestionResponseDto({
            id: tq.question.id,
            question: tq.question.question,
            courseId: tq.question.courseId,
            moduleId: tq.question.moduleId,
            answers: tq.question.answers.map((a) => ({
              id: a.id,
              answer: a.answer,
              isCorrect: a.isCorrect,
            })),
          }),
      ),
    });
  }
}
