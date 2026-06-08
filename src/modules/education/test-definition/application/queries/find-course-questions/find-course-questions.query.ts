import { Query } from '@/libs/application/query.base';

export class FindCourseQuestionsQuery extends Query {
  readonly courseId: string;

  constructor(props: { courseId: string }) {
    super();
    this.courseId = props.courseId;
  }
}
