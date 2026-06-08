import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';

export class FindMyEnrollmentsQuery extends PaginatedQuery {
  constructor(props: PaginatedParams<FindMyEnrollmentsQuery>) {
    super(props);
  }
}
