import { Query } from '@/libs/application/query.base';

export class FindTestAttemptQuery extends Query {
  readonly attemptId: string;

  constructor(props: { attemptId: string }) {
    super();
    this.attemptId = props.attemptId;
  }
}
