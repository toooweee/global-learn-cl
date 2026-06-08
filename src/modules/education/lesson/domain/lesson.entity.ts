import { randomUUID } from 'node:crypto';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateLessonProps,
  LessonProps,
} from '@/modules/education/lesson/lesson.types';

export class LessonEntity extends Entity<LessonProps> {
  protected constructor(props: CreateEntityProps<LessonProps>) {
    super(props);
  }

  static create(props: CreateLessonProps): LessonEntity {
    return new LessonEntity({
      id: randomUUID(),
      props: { ...props, content: props.content ?? '', createdAt: new Date() },
    });
  }

  static recreate(params: {
    id: AggregateId;
    props: LessonProps;
  }): LessonEntity {
    return new LessonEntity(params);
  }

  update(props: { name?: string; content?: string }): void {
    if (props.name !== undefined) this._props.name = props.name;
    if (props.content !== undefined) this._props.content = props.content;
    this._props.updatedAt = new Date();
  }
}
