import { randomUUID } from 'node:crypto';
import {
  CourseProps,
  CreateCourseProps,
} from '@/modules/education/course/course.types';
import { Entity } from '@/libs/ddd/entity.base';

export class CourseEntity extends Entity<CourseProps> {
  private constructor(props: CreateCourseProps) {
    super({
      id: randomUUID(),
      props: {
        ...props,
        createdAt: new Date(),
      },
    });
  }

  static create(props: CreateCourseProps) {
    return new CourseEntity(props);
  }
}
