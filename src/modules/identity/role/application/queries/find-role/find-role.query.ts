import { Query } from '@/libs/application';

export class FindRoleQuery extends Query {
  readonly id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }
}
