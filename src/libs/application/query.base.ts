import { RequestContextService } from '@/libs/application/context';

export interface QueryMetadata {
  readonly correlationId: string;
  readonly timestamp: number;
}

export class Query {
  readonly metadata: QueryMetadata;

  constructor() {
    this.metadata = {
      correlationId: RequestContextService.getRequestId(),
      timestamp: Date.now(),
    };
  }
}

export type OrderBy = { field: string | true; param: 'asc' | 'desc' };

export type PaginatedQueryParams = {
  limit: number;
  page: number;
  offset: number;
  orderBy: OrderBy;
};

export type PaginatedParams<T> = Omit<
  T,
  'limit' | 'page' | 'offset' | 'orderBy' | 'metadata'
> &
  Partial<Omit<PaginatedQueryParams, 'offset'>>;

export class Paginated<T> {
  readonly limit: number;
  readonly page: number;
  readonly count: number;
  readonly data: readonly T[];

  constructor(props: Paginated<T>) {
    this.limit = props.limit;
    this.page = props.page;
    this.count = props.count;
    this.data = props.data;
  }
}

export class PaginatedQuery extends Query {
  limit: number;
  page: number;
  offset: number;
  orderBy: OrderBy;

  constructor(props: PaginatedParams<PaginatedQuery>) {
    super();
    this.limit = props.limit || 20;
    this.page = props.page || 1;
    this.offset = (this.page - 1) * this.limit;
    this.orderBy = props.orderBy || { field: true, param: 'desc' };
  }
}
