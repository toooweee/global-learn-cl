import { randomUUID } from 'node:crypto';
import { EnrollmentStatus } from '@generated/client';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import { DomainException } from '@/libs/ddd/domain.exception';
import {
  CreateEnrollmentProps,
  EnrollmentProps,
  StepProgressProps,
} from '@/modules/education/enrollment/enrollment.types';

export class EnrollmentEntity extends Entity<EnrollmentProps> {
  protected constructor(props: CreateEntityProps<EnrollmentProps>) {
    super(props);
  }

  static create(props: CreateEnrollmentProps): EnrollmentEntity {
    return new EnrollmentEntity({
      id: randomUUID(),
      props: {
        ...props,
        status: EnrollmentStatus.IN_PROGRESS,
        startedAt: new Date(),
        progress: [],
        createdAt: new Date(),
      },
    });
  }

  static recreate(params: {
    id: AggregateId;
    props: EnrollmentProps;
  }): EnrollmentEntity {
    return new EnrollmentEntity(params);
  }

  startStep(stepId: string): void {
    const existing = this._props.progress.find((p) => p.stepId === stepId);
    if (existing) return;
    this._props.progress.push({
      id: randomUUID(),
      stepId,
      createdAt: new Date(),
    });
    this._props.updatedAt = new Date();
  }

  completeStep(stepId: string): void {
    let entry: StepProgressProps | undefined = this._props.progress.find(
      (p) => p.stepId === stepId,
    );
    if (!entry) {
      entry = { id: randomUUID(), stepId, createdAt: new Date() };
      this._props.progress.push(entry);
    }
    entry.completedAt = new Date();
    this._props.updatedAt = new Date();
  }

  markCompleted(): void {
    this._props.status = EnrollmentStatus.COMPLETED;
    this._props.completedAt = new Date();
    this._props.updatedAt = new Date();
  }

  cancel(): void {
    if (this._props.status === EnrollmentStatus.COMPLETED) {
      throw new DomainException(
        'Cannot cancel a completed enrollment',
        'ENROLLMENT_ALREADY_COMPLETED',
      );
    }
    this._props.status = EnrollmentStatus.CANCELLED;
    this._props.updatedAt = new Date();
  }
}
