import { Query } from '@/libs/application';

export class GetTestQuestionsQuery extends Query {
  readonly testId: string;

  constructor(props: { testId: string }) {
    super();
    this.testId = props.testId;
  }
}
