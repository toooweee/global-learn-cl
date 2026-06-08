import { ApplicationStatus } from '@generated/client';
import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';

export class FindApplicationsForCourseQuery extends PaginatedQuery {
  readonly courseId: string;
  readonly status?: ApplicationStatus;

  constructor(
    props: PaginatedParams<FindApplicationsForCourseQuery> & {
      courseId: string;
      status?: ApplicationStatus;
    },
  ) {
    super(props);
    this.courseId = props.courseId;
    this.status = props.status;
  }
}
