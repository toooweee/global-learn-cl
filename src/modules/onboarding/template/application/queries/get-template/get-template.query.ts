import { IQuery } from '@nestjs/cqrs';
import { Query } from '@/libs/application/query.base';

export class GetOnboardingTemplateQuery extends Query implements IQuery {
  readonly templateId: string;
  constructor(props: { templateId: string }) {
    super();
    this.templateId = props.templateId;
  }
}
