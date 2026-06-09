import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { QuestionBankStatsDto } from '@/modules/education/test-definition/presentation/dto/test-definition.response.dto';
import { GetQuestionBankStatsQuery } from './get-question-bank-stats.query';

@QueryHandler(GetQuestionBankStatsQuery)
export class GetQuestionBankStatsQueryHandler implements IQueryHandler<
  GetQuestionBankStatsQuery,
  QuestionBankStatsDto
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: GetQuestionBankStatsQuery,
  ): Promise<QuestionBankStatsDto> {
    const courseId = query.courseId;

    const [total, usedIds, byModule] = await Promise.all([
      this.prismaService.client.courseQuestion.count({ where: { courseId } }),

      this.prismaService.client.testQuestion.findMany({
        where: { question: { courseId } },
        select: { questionId: true },
        distinct: ['questionId'],
      }),

      this.prismaService.client.courseQuestion.groupBy({
        by: ['moduleId'],
        where: { courseId },
        _count: { id: true },
      }),
    ]);

    return new QuestionBankStatsDto({
      total,
      usedInTests: usedIds.length,
      byModule: byModule.map((g) => ({
        moduleId: g.moduleId,
        count: g._count.id,
      })),
    });
  }
}
