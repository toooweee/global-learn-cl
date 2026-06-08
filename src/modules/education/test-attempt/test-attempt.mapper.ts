import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { TestAttemptEntity } from '@/modules/education/test-attempt/domain/test-attempt.entity';

export const testAttemptInclude = {
  answers: true,
} satisfies Prisma.TestAttemptInclude;

export type TestAttemptRecord = Prisma.TestAttemptGetPayload<{
  include: typeof testAttemptInclude;
}>;

@Injectable()
export class TestAttemptMapper implements ToDomain<
  TestAttemptRecord,
  TestAttemptEntity
> {
  toDomain(row: TestAttemptRecord): TestAttemptEntity {
    return TestAttemptEntity.recreate({
      id: row.id,
      props: {
        testId: row.testId,
        employeeId: row.employeeId,
        endedAt: row.endedAt ?? undefined,
        createdAt: row.createdAt,
        answers: row.answers.map((a) => ({
          id: a.id,
          questionId: a.questionId,
          answerId: a.answerId,
          option: a.option,
          createdAt: a.createdAt,
        })),
      },
    });
  }
}
