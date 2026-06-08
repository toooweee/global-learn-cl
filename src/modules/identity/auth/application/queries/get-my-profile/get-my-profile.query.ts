import { Query } from '@/libs/application/query.base';

export class GetMyProfileQuery extends Query {
  readonly userId: string;
  constructor(userId: string) {
    super();
    this.userId = userId;
  }
}
