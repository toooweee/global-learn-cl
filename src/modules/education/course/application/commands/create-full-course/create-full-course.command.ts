import { Command, CommandProps } from '@/libs/application/command.base';
import { StepType } from '@generated/client';
import { CourseScope } from '@/modules/education/course/course.types';

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
  readonly scope?: CourseScope;
  readonly departmentId?: string;
  readonly divisionId?: string;
  readonly coverId?: string;
  readonly modules: FullCourseModuleInput[];

  constructor(props: CommandProps<CreateFullCourseCommand>) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.scope = props.scope;
    this.departmentId = props.departmentId;
    this.divisionId = props.divisionId;
    this.coverId = props.coverId;
    this.modules = props.modules;
  }
}
