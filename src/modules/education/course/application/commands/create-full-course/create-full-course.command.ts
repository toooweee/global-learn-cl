import { Command, CommandProps } from '@/libs/application/command.base';
import { StepType } from '@generated/client';

export interface FullCourseStepInput {
  name: string;
  type: StepType;
  lessonId?: string;
  testId?: string;
}

export interface FullCourseModuleInput {
  name: string;
  steps?: FullCourseStepInput[];
}

export class CreateFullCourseCommand extends Command {
  readonly name: string;
  readonly description: string;
  readonly coverId?: string;
  readonly modules: FullCourseModuleInput[];

  constructor(props: CommandProps<CreateFullCourseCommand>) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.coverId = props.coverId;
    this.modules = props.modules;
  }
}
