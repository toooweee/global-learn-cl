import { Query } from '@/libs/application/query.base';

export class FindCourseQuestionQuery extends Query {
  readonly questionId: string;

  constructor(props: { questionId: string }) {
    super();
    this.questionId = props.questionId;
  }
}
