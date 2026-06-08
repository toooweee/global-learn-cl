import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/client';
import type { Test as TestRecord } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { TestDefinitionEntity } from '@/modules/education/test-definition/domain/test-definition.entity';
import { CourseQuestionEntity } from '@/modules/education/test-definition/domain/course-question.entity';

export const courseQuestionInclude = {
  answers: true,
} satisfies Prisma.CourseQuestionInclude;

export type CourseQuestionRecord = Prisma.CourseQuestionGetPayload<{
  include: typeof courseQuestionInclude;
}>;

@Injectable()
export class TestDefinitionMapper implements ToDomain<
  TestRecord,
  TestDefinitionEntity
> {
  toDomain(row: TestRecord): TestDefinitionEntity {
    return TestDefinitionEntity.recreate({
      id: row.id,
      props: {
        name: row.name,
        passingPercent: row.passingPercent,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  }

  questionToDomain(row: CourseQuestionRecord): CourseQuestionEntity {
    return CourseQuestionEntity.recreate({
      id: row.id,
      props: {
        courseId: row.courseId,
        moduleId: row.moduleId ?? undefined,
        question: row.question,
        answers: row.answers.map((a) => ({
          id: a.id,
          answer: a.answer,
          isCorrect: a.isCorrect,
        })),
        createdAt: new Date(),
      },
    });
  }
}
