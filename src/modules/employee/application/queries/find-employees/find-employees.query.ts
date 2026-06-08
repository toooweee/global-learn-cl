import { PaginatedQuery, PaginatedParams } from '@/libs/application';

export class FindEmployeesQuery extends PaginatedQuery {
  readonly divisionId?: string;
  readonly departmentId?: string;
  readonly roleId?: string;

  constructor(
    props: PaginatedParams<FindEmployeesQuery> & {
      divisionId?: string;
      departmentId?: string;
      roleId?: string;
    },
  ) {
    super(props);
    this.divisionId = props.divisionId;
    this.departmentId = props.departmentId;
    this.roleId = props.roleId;
  }
}
