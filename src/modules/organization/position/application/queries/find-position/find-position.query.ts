import { Query } from '@/libs/application';

export class FindPositionQuery extends Query {
  readonly id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }
}
