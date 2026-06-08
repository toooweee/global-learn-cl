import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';

export class GetCoursesOverviewQuery extends PaginatedQuery {
  constructor(props: PaginatedParams<GetCoursesOverviewQuery>) {
    super(props);
  }
}
