import { Query } from '@/libs/application/query.base';

export class GetQuestionBankStatsQuery extends Query {
  readonly courseId: string;

  constructor(props: { courseId: string }) {
    super();
    this.courseId = props.courseId;
  }
}
