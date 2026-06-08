import { randomUUID } from 'node:crypto';
import { ApplicationStatus } from '@generated/client';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import { DomainException } from '@/libs/ddd/domain.exception';
import {
  CourseApplicationProps,
  CreateCourseApplicationProps,
} from '@/modules/education/course-application/course-application.types';

export class CourseApplicationEntity extends Entity<CourseApplicationProps> {
  protected constructor(props: CreateEntityProps<CourseApplicationProps>) {
    super(props);
  }

  static create(props: CreateCourseApplicationProps): CourseApplicationEntity {
    return new CourseApplicationEntity({
      id: randomUUID(),
      props: {
        ...props,
        status: ApplicationStatus.PENDING,
        createdAt: new Date(),
      },
    });
  }

  static recreate(params: {
    id: AggregateId;
    props: CourseApplicationProps;
  }): CourseApplicationEntity {
    return new CourseApplicationEntity(params);
  }

  approve(): void {
    if (this._props.status !== ApplicationStatus.PENDING) {
      throw new DomainException(
        'Only pending applications can be approved',
        'COURSE_APPLICATION_NOT_PENDING',
      );
    }
    this._props.status = ApplicationStatus.APPROVED;
    this._props.updatedAt = new Date();
  }

  reject(): void {
    if (this._props.status !== ApplicationStatus.PENDING) {
      throw new DomainException(
        'Only pending applications can be rejected',
        'COURSE_APPLICATION_NOT_PENDING',
      );
    }
    this._props.status = ApplicationStatus.REJECTED;
    this._props.updatedAt = new Date();
  }
}
