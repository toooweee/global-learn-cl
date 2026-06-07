import { PaginatedParams, PaginatedQuery } from '@/libs/application';

export class FindRolesQuery extends PaginatedQuery {
  constructor(props: PaginatedParams<FindRolesQuery>) {
    super(props);
  }
}
