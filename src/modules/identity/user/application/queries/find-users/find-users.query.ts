import { PaginatedParams, PaginatedQuery } from '@/libs/application';

export class FindUsersQuery extends PaginatedQuery {
  constructor(props: PaginatedParams<FindUsersQuery>) {
    super(props);
  }
}
