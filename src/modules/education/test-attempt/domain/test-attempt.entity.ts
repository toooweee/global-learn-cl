import { randomUUID } from 'node:crypto';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import { DomainException } from '@/libs/ddd/domain.exception';
import {
  CreateTestAttemptProps,
  TestAttemptAnswerProps,
  TestAttemptProps,
} from '@/modules/education/test-attempt/test-attempt.types';

export class TestAttemptEntity extends Entity<TestAttemptProps> {
  protected constructor(props: CreateEntityProps<TestAttemptProps>) {
    super(props);
  }

  static create(props: CreateTestAttemptProps): TestAttemptEntity {
    return new TestAttemptEntity({
      id: randomUUID(),
      props: {
        ...props,
        answers: [],
        createdAt: new Date(),
      },
    });
  }

  static recreate(params: {
    id: AggregateId;
    props: TestAttemptProps;
  }): TestAttemptEntity {
    return new TestAttemptEntity(params);
  }

  answerQuestion(questionId: string, answerId: string, option: string): void {
    if (this._props.endedAt) {
      throw new DomainException(
        'Cannot answer a finished attempt',
        'TEST_ATTEMPT_ALREADY_FINISHED',
      );
    }
    const existing = this._props.answers.find(
      (a) => a.questionId === questionId,
    );
    if (existing) {
      existing.answerId = answerId;
      existing.option = option;
    } else {
      this._props.answers.push({
        id: randomUUID(),
        questionId,
        answerId,
        option,
        createdAt: new Date(),
      });
    }
  }

  finish(): void {
    if (this._props.endedAt) {
      throw new DomainException(
        'Attempt already finished',
        'TEST_ATTEMPT_ALREADY_FINISHED',
      );
    }
    this._props.endedAt = new Date();
  }

  get isFinished(): boolean {
    return !!this._props.endedAt;
  }

  getAnswers(): TestAttemptAnswerProps[] {
    return this._props.answers;
  }
}
