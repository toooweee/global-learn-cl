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
  'limit' | 'offset' | 'orderBy' | 'page'
> &
  Partial<Omit<PaginatedQueryParams, 'offset'>>;

export class Paginated<T> {
  readonly count: number;
  readonly limit: number;
  readonly page: number;
  readonly data: readonly T[];

  constructor(props: Paginated<T>) {
    this.count = props.count;
    this.limit = props.limit;
    this.page = props.page;
    this.data = props.data;
  }
}

export class PaginatedQueryBase extends Query {
  limit: number;
  offset: number;
  page: number;
  orderBy: OrderBy;

  constructor(props: PaginatedParams<PaginatedQueryBase>) {
    super();
    this.limit = props.limit || 20;
    this.offset = (this.page - 1) * this.limit;
    this.page = props.page || 1;
    this.orderBy = props.orderBy || { field: true, param: 'desc' };
  }
}
