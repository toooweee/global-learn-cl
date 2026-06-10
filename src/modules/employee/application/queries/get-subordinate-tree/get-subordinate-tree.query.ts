import { Query } from '@/libs/application';

export class GetSubordinateTreeQuery extends Query {
  readonly managerUserId: string;
  constructor(managerUserId: string) {
    super();
    this.managerUserId = managerUserId;
  }
}
