import { PaginatedQuery, PaginatedParams } from '@/libs/application';

export class FindDivisionsQuery extends PaginatedQuery {
  readonly departmentId?: string;

  constructor(
    props: PaginatedParams<FindDivisionsQuery> & { departmentId?: string },
  ) {
    super(props);
    this.departmentId = props.departmentId;
  }
}
