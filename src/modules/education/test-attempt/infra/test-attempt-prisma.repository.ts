import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TestAttemptEntity } from '@/modules/education/test-attempt/domain/test-attempt.entity';
import {
  TestAttemptMapper,
  testAttemptInclude,
} from '@/modules/education/test-attempt/test-attempt.mapper';
import { TestAttemptRepositoryPort } from '@/modules/education/test-attempt/application/ports/test-attempt.repository.port';

@Injectable()
export class TestAttemptPrismaRepository
  extends PrismaRepositoryBase
  implements TestAttemptRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: TestAttemptMapper,
  ) {
    super(prismaService);
  }

  async save(entity: TestAttemptEntity): Promise<void> {
    const props = entity.getProps();

    await this.db.testAttempt.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        testId: props.testId,
        employeeId: props.employeeId,
        createdAt: props.createdAt,
        endedAt: props.endedAt ?? null,
      },
      update: {
        endedAt: props.endedAt ?? null,
      },
    });

    for (const a of props.answers) {
      await this.db.testAttemptAnswer.upsert({
        where: { id: a.id },
        create: {
          id: a.id,
          attemptId: entity.id,
          questionId: a.questionId,
          answerId: a.answerId,
          option: a.option,
          createdAt: a.createdAt,
        },
        update: {
          answerId: a.answerId,
          option: a.option,
        },
      });
    }
  }

  async findById(id: string): Promise<Option<TestAttemptEntity>> {
    const row = await this.db.testAttempt.findUnique({
      where: { id },
      include: testAttemptInclude,
    });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }
}
