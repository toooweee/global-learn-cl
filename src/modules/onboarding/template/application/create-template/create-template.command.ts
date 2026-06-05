import { Command } from '@/libs/application/command.base';
import { CreateOnboardingTemplateProps } from '@/modules/onboarding/template/template.types';

export class CreateOnboardingTemplateCommand extends Command {
  readonly name: string;
  readonly description: string;
  readonly positionId: string;
  readonly divisionId: string;
  readonly coverId?: string;
  readonly steps: CreateOnboardingTemplateProps['steps'];

  constructor(props: {
    name: string;
    description: string;
    positionId: string;
    divisionId: string;
    coverId?: string;
    steps: CreateOnboardingTemplateProps['steps'];
  }) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.positionId = props.positionId;
    this.divisionId = props.divisionId;
    this.coverId = props.coverId;
    this.steps = props.steps;
  }
}
