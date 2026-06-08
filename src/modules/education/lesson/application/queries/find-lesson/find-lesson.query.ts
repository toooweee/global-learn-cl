import { Query } from '@/libs/application/query.base';

export class FindLessonQuery extends Query {
  readonly lessonId: string;

  constructor(props: { lessonId: string }) {
    super();
    this.lessonId = props.lessonId;
  }
}
