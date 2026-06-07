import { Query } from '@/libs/application';

export class FindMySubordinatesQuery extends Query {
  readonly currentEmployeeId: string;
  constructor(currentEmployeeId: string) {
    super();
    this.currentEmployeeId = currentEmployeeId;
  }
}
