import { Query } from '@/libs/application/query.base';

export class FindCourseQuestionsQuery extends Query {
  readonly courseId: string;
  readonly moduleId?: string;

  constructor(props: { courseId: string; moduleId?: string }) {
    super();
    this.courseId = props.courseId;
    this.moduleId = props.moduleId;
  }
}
