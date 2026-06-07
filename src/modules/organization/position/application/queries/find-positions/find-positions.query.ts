import { PaginatedQuery, PaginatedParams } from '@/libs/application';

export class FindPositionsQuery extends PaginatedQuery {
  constructor(props: PaginatedParams<FindPositionsQuery>) {
    super(props);
  }
}
