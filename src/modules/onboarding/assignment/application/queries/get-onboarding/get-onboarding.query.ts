import { IQuery } from '@nestjs/cqrs';
import { Query } from '@/libs/application/query.base';

export class GetOnboardingQuery extends Query implements IQuery {
  readonly onboardingId: string;
  constructor(props: { onboardingId: string }) {
    super();
    this.onboardingId = props.onboardingId;
  }
}
