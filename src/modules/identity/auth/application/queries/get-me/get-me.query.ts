import { Query } from '@/libs/application';

export class GetMeQuery extends Query {
  readonly userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }
}
