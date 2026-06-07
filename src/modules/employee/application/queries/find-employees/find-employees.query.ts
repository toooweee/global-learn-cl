import { PaginatedQuery, PaginatedParams } from '@/libs/application';

export class FindEmployeesQuery extends PaginatedQuery {
  readonly divisionId?: string;

  constructor(
    props: PaginatedParams<FindEmployeesQuery> & { divisionId?: string },
  ) {
    super(props);
    this.divisionId = props.divisionId;
  }
}
