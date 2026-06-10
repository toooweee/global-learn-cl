import { Query } from '@/libs/application/query.base';

export class GetManagerDashboardQuery extends Query {
  readonly managerEmployeeId: string;

  constructor(managerEmployeeId: string) {
    super();
    this.managerEmployeeId = managerEmployeeId;
  }
}
