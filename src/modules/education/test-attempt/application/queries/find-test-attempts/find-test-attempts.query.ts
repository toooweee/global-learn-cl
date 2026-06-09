import { Query } from '@/libs/application';

export class FindTestAttemptsQuery extends Query {
  readonly testId: string;

  constructor(props: { testId: string }) {
    super();
    this.testId = props.testId;
  }
}
