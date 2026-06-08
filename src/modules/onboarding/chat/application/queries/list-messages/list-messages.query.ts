import { IQuery } from '@nestjs/cqrs';
import { Query } from '@/libs/application/query.base';

export class ListChatMessagesQuery extends Query implements IQuery {
  readonly onboardingId: string;
  readonly before?: string;
  readonly limit: number;

  constructor(props: {
    onboardingId: string;
    before?: string;
    limit?: number;
  }) {
    super();
    this.onboardingId = props.onboardingId;
    this.before = props.before;
    this.limit = props.limit ?? 20;
  }
}
