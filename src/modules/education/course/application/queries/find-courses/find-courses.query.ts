import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';
import { CourseScope } from '@/modules/education/course/course.types';

export class FindCoursesQuery extends PaginatedQuery {
  readonly authorId?: string;
  readonly scope?: CourseScope;
  readonly departmentId?: string;
  readonly divisionId?: string;
  readonly visibleToMe?: boolean;
  readonly includeArchived?: boolean;

  constructor(props: PaginatedParams<FindCoursesQuery>) {
    super(props);
    this.authorId = props.authorId;
    this.scope = props.scope;
    this.departmentId = props.departmentId;
    this.divisionId = props.divisionId;
    this.visibleToMe = props.visibleToMe;
    this.includeArchived = props.includeArchived;
  }
}
