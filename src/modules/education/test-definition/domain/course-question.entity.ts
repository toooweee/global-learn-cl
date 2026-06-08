import { randomUUID } from 'node:crypto';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import { DomainException } from '@/libs/ddd/domain.exception';
import {
  CourseAnswerProps,
  CourseQuestionProps,
  CreateCourseQuestionProps,
} from '@/modules/education/test-definition/test-definition.types';

export class CourseQuestionEntity extends Entity<CourseQuestionProps> {
  protected constructor(props: CreateEntityProps<CourseQuestionProps>) {
    super(props);
  }

  static create(props: CreateCourseQuestionProps): CourseQuestionEntity {
    return new CourseQuestionEntity({
      id: randomUUID(),
      props: {
        courseId: props.courseId,
        moduleId: props.moduleId,
        question: props.question,
        answers: props.answers.map((a) => ({ id: randomUUID(), ...a })),
        createdAt: new Date(),
      },
    });
  }

  static recreate(params: {
    id: AggregateId;
    props: CourseQuestionProps;
  }): CourseQuestionEntity {
    return new CourseQuestionEntity(params);
  }

  updateQuestion(text: string): void {
    this._props.question = text;
    this._props.updatedAt = new Date();
  }

  addAnswer(answer: string, isCorrect: boolean): string {
    const id = randomUUID();
    this._props.answers.push({ id, answer, isCorrect });
    this._props.updatedAt = new Date();
    return id;
  }

  removeAnswer(answerId: string): void {
    const idx = this._props.answers.findIndex((a) => a.id === answerId);
    if (idx === -1) {
      throw new DomainException(
        `Answer ${answerId} not found`,
        'COURSE_ANSWER_NOT_FOUND',
      );
    }
    this._props.answers.splice(idx, 1);
    this._props.updatedAt = new Date();
  }

  getAnswers(): CourseAnswerProps[] {
    return this._props.answers;
  }
}
