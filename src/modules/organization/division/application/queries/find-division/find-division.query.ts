import { Query } from '@/libs/application';

export class FindDivisionQuery extends Query {
  readonly id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }
}
