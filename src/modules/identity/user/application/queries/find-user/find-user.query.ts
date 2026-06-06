import { Query } from '@/libs/application';

export class FindUserQuery extends Query {
  constructor(readonly id: string) {
    super();
  }
}
