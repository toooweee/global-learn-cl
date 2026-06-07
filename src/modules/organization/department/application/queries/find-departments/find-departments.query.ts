import { PaginatedQuery, PaginatedParams } from '@/libs/application';

export class FindDepartmentsQuery extends PaginatedQuery {
  constructor(props: PaginatedParams<FindDepartmentsQuery>) {
    super(props);
  }
}
