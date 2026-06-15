import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  TestForAttemptDto,
  AttemptQuestionDto,
  AttemptOptionDto,
} from '@/modules/education/test-attempt/presentation/dto/test-attempt.response.dto';
import { GetTestQuestionsQuery } from './get-test-questions.query';

/**
 * Taker-facing read: returns a test's questions and options WITHOUT the
 * `isCorrect` flag, so the correct answers are never exposed to the employee
 * taking the test (grading happens server-side on finish). Available to any
 * authenticated user, unlike the admin-only test-definition read.
 */
@QueryHandler(GetTestQuestionsQuery)
export class GetTestQuestionsQueryHandler implements IQueryHandler<
  GetTestQuestionsQuery,
  TestForAttemptDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetTestQuestionsQuery): Promise<TestForAttemptDto> {
    const row = await this.prismaService.client.test.findUnique({
      where: { id: query.testId },
      select: {
        id: true,
        passingPercent: true,
        questions: {
          select: {
            question: {
              select: {
                id: true,
                question: true,
                answers: { select: { id: true, answer: true } },
              },
            },
          },
        },
      },
    });

    if (!row) {
      throw new ApplicationException('Test not found', 404, 'TEST_NOT_FOUND');
    }

    return new TestForAttemptDto({
      testId: row.id,
      passingPercent: row.passingPercent,
      questions: row.questions.map(
        (tq) =>
          new AttemptQuestionDto({
            id: tq.question.id,
            question: tq.question.question,
            options: tq.question.answers.map(
              (a) => new AttemptOptionDto({ id: a.id, text: a.answer }),
            ),
          }),
      ),
    });
  }
}
