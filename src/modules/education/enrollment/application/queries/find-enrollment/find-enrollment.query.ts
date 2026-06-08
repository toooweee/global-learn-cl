import { Query } from '@/libs/application/query.base';

export class FindEnrollmentQuery extends Query {
  readonly enrollmentId: string;

  constructor(props: { enrollmentId: string }) {
    super();
    this.enrollmentId = props.enrollmentId;
  }
}
