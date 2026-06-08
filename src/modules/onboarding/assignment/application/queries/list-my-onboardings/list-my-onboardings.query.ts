import { IQuery } from '@nestjs/cqrs';
import { Query } from '@/libs/application/query.base';

export class ListMyOnboardingsQuery extends Query implements IQuery {
  constructor() {
    super();
  }
}
