import { OnboardingStatus } from '@generated/client';
import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';

export class ListOnboardingsQuery extends PaginatedQuery {
  readonly assignedToId?: string;
  readonly assignedById?: string;
  readonly status?: OnboardingStatus;

  constructor(
    props: PaginatedParams<ListOnboardingsQuery> & {
      assignedToId?: string;
      assignedById?: string;
      status?: OnboardingStatus;
    },
  ) {
    super(props);
    this.assignedToId = props.assignedToId;
    this.assignedById = props.assignedById;
    this.status = props.status;
  }
}
