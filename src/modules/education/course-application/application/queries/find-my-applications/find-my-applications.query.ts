import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';

export class FindMyApplicationsQuery extends PaginatedQuery {
  constructor(props: PaginatedParams<FindMyApplicationsQuery>) {
    super(props);
  }
}
