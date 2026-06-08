import { Command, CommandProps } from '@/libs/application/command.base';
import { CourseScope } from '@/modules/education/course/course.types';

export class CreateCourseCommand extends Command {
  readonly name: string;
  readonly description: string;
  readonly scope?: CourseScope;
  readonly departmentId?: string;
  readonly divisionId?: string;
  readonly coverId?: string;

  constructor(props: CommandProps<CreateCourseCommand>) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.scope = props.scope;
    this.departmentId = props.departmentId;
    this.divisionId = props.divisionId;
    this.coverId = props.coverId;
  }
}
