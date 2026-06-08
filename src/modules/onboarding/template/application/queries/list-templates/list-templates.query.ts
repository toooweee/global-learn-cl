import { IQuery } from '@nestjs/cqrs';
import { PaginatedQuery, PaginatedParams } from '@/libs/application/query.base';

export class ListOnboardingTemplatesQuery
  extends PaginatedQuery
  implements IQuery
{
  readonly positionId?: string;
  readonly divisionId?: string;

  constructor(
    props: PaginatedParams<ListOnboardingTemplatesQuery> & {
      positionId?: string;
      divisionId?: string;
    },
  ) {
    super(props);
    this.positionId = props.positionId;
    this.divisionId = props.divisionId;
  }
}
