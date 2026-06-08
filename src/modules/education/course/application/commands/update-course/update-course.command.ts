import { Command, CommandProps } from '@/libs/application/command.base';
import { CourseScope } from '@/modules/education/course/course.types';

export class UpdateCourseCommand extends Command {
  readonly courseId: string;
  readonly name?: string;
  readonly description?: string;
  readonly coverId?: string | null;
  readonly scope?: CourseScope;
  readonly departmentId?: string | null;
  readonly divisionId?: string | null;

  constructor(props: CommandProps<UpdateCourseCommand>) {
    super(props);
    this.courseId = props.courseId;
    this.name = props.name;
    this.description = props.description;
    this.coverId = props.coverId;
    this.scope = props.scope;
    this.departmentId = props.departmentId;
    this.divisionId = props.divisionId;
  }
}
