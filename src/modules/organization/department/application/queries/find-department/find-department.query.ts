import { Query } from '@/libs/application';

export class FindDepartmentQuery extends Query {
  readonly id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }
}
