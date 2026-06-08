import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';

export class FindCoursesQuery extends PaginatedQuery {
  readonly authorId?: string;

  constructor(props: PaginatedParams<FindCoursesQuery>) {
    super(props);
    this.authorId = props.authorId;
  }
}
