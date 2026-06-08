import { Query } from '@/libs/application/query.base';

export class FindTestDefinitionQuery extends Query {
  readonly testId: string;

  constructor(props: { testId: string }) {
    super();
    this.testId = props.testId;
  }
}
