import { randomUUID } from 'node:crypto';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import {
  CreateTestDefinitionProps,
  TestDefinitionProps,
} from '@/modules/education/test-definition/test-definition.types';

export class TestDefinitionEntity extends Entity<TestDefinitionProps> {
  protected constructor(props: CreateEntityProps<TestDefinitionProps>) {
    super(props);
  }

  static create(props: CreateTestDefinitionProps): TestDefinitionEntity {
    return new TestDefinitionEntity({
      id: randomUUID(),
      props: {
        ...props,
        passingPercent: props.passingPercent ?? 80,
        createdAt: new Date(),
      },
    });
  }

  static recreate(params: {
    id: AggregateId;
    props: TestDefinitionProps;
  }): TestDefinitionEntity {
    return new TestDefinitionEntity(params);
  }

  update(props: { name?: string; passingPercent?: number }): void {
    if (props.name !== undefined) this._props.name = props.name;
    if (props.passingPercent !== undefined)
      this._props.passingPercent = props.passingPercent;
    this._props.updatedAt = new Date();
  }
}
