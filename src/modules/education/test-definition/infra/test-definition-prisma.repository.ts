import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { TestDefinitionEntity } from '@/modules/education/test-definition/domain/test-definition.entity';
import { CourseQuestionEntity } from '@/modules/education/test-definition/domain/course-question.entity';
import {
  TestDefinitionMapper,
  courseQuestionInclude,
} from '@/modules/education/test-definition/test-definition.mapper';
import {
  CourseQuestionRepositoryPort,
  TestDefinitionRepositoryPort,
} from '@/modules/education/test-definition/application/ports/test-definition.repository.port';

@Injectable()
export class TestDefinitionPrismaRepository
  extends PrismaRepositoryBase
  implements TestDefinitionRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: TestDefinitionMapper,
  ) {
    super(prismaService);
  }

  async save(entity: TestDefinitionEntity): Promise<void> {
    const props = entity.getProps();
    await this.db.test.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        name: props.name,
        passingPercent: props.passingPercent,
        createdAt: props.createdAt,
      },
      update: {
        name: props.name,
        passingPercent: props.passingPercent,
        updatedAt: props.updatedAt ?? new Date(),
      },
    });
  }

  async findById(id: string): Promise<Option<TestDefinitionEntity>> {
    const row = await this.db.test.findUnique({ where: { id } });
    return row ? Some(this.mapper.toDomain(row)) : None;
  }

  async delete(id: string): Promise<void> {
    await this.db.test.delete({ where: { id } });
  }

  async addQuestion(testId: string, questionId: string): Promise<void> {
    await this.db.testQuestion.upsert({
      where: { testId_questionId: { testId, questionId } },
      create: { id: randomUUID(), testId, questionId },
      update: {},
    });
  }

  async removeQuestion(testId: string, questionId: string): Promise<void> {
    await this.db.testQuestion.delete({
      where: { testId_questionId: { testId, questionId } },
    });
  }

  async bulkAddQuestions(testId: string, questionIds: string[]): Promise<void> {
    await this.db.testQuestion.createMany({
      data: questionIds.map((questionId) => ({
        id: randomUUID(),
        testId,
        questionId,
      })),
      skipDuplicates: true,
    });
  }

  async replaceQuestions(testId: string, questionIds: string[]): Promise<void> {
    await this.db.$transaction([
      this.db.testQuestion.deleteMany({ where: { testId } }),
      this.db.testQuestion.createMany({
        data: questionIds.map((questionId) => ({
          id: randomUUID(),
          testId,
          questionId,
        })),
      }),
    ]);
  }
}

@Injectable()
export class CourseQuestionPrismaRepository
  extends PrismaRepositoryBase
  implements CourseQuestionRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: TestDefinitionMapper,
  ) {
    super(prismaService);
  }

  async save(entity: CourseQuestionEntity): Promise<void> {
    const props = entity.getProps();

    await this.db.courseQuestion.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        courseId: props.courseId,
        moduleId: props.moduleId ?? null,
        question: props.question,
        answers: {
          create: props.answers.map((a) => ({
            id: a.id,
            answer: a.answer,
            isCorrect: a.isCorrect,
          })),
        },
      },
      update: {
        question: props.question,
        moduleId: props.moduleId ?? null,
        answers: {
          deleteMany: {},
          create: props.answers.map((a) => ({
            id: a.id,
            answer: a.answer,
            isCorrect: a.isCorrect,
          })),
        },
      },
    });
  }

  async findById(id: string): Promise<Option<CourseQuestionEntity>> {
    const row = await this.db.courseQuestion.findUnique({
      where: { id },
      include: courseQuestionInclude,
    });
    return row ? Some(this.mapper.questionToDomain(row)) : None;
  }

  async findByCourse(courseId: string): Promise<CourseQuestionEntity[]> {
    const rows = await this.db.courseQuestion.findMany({
      where: { courseId },
      include: courseQuestionInclude,
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.mapper.questionToDomain(r));
  }

  async delete(id: string): Promise<void> {
    await this.db.courseQuestion.delete({ where: { id } });
  }
}
