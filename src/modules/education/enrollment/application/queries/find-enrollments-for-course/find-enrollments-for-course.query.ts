import { PaginatedParams, PaginatedQuery } from '@/libs/application/query.base';

export class FindEnrollmentsForCourseQuery extends PaginatedQuery {
  readonly courseId: string;

  constructor(
    props: PaginatedParams<FindEnrollmentsForCourseQuery> & {
      courseId: string;
    },
  ) {
    super(props);
    this.courseId = props.courseId;
  }
}
