import { Command } from '@/libs/application/command.base';

export class AssignOnboardingCommand extends Command {
  readonly templateId: string;
  readonly assignedById: string;
  readonly assignedToId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly nameOverride?: string;
  readonly descriptionOverride?: string;

  constructor(props: {
    templateId: string;
    assignedById: string;
    assignedToId: string;
    startDate: Date;
    endDate: Date;
    nameOverride?: string;
    descriptionOverride?: string;
  }) {
    super(props);
    this.templateId = props.templateId;
    this.assignedById = props.assignedById;
    this.assignedToId = props.assignedToId;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.nameOverride = props.nameOverride;
    this.descriptionOverride = props.descriptionOverride;
  }
}
