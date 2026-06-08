import { ICommand } from '@nestjs/cqrs';
import { Command, CommandProps } from '@/libs/application/command.base';
import { CreateOnboardingTemplateStepProps } from '@/modules/onboarding/template/template.types';

export class UpdateOnboardingTemplateCommand
  extends Command
  implements ICommand
{
  readonly templateId: string;
  readonly name: string;
  readonly description: string;
  readonly coverId?: string;
  readonly steps: CreateOnboardingTemplateStepProps[];

  constructor(props: CommandProps<UpdateOnboardingTemplateCommand>) {
    super(props);
    this.templateId = props.templateId;
    this.name = props.name;
    this.description = props.description;
    this.coverId = props.coverId;
    this.steps = props.steps;
  }
}
