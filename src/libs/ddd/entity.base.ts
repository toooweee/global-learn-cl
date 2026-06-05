export type AggregateId = string;

export interface CreateEntityProps<T> {
  id: AggregateId;
  props: T;
}

export abstract class Entity<EntityProps> {
  protected readonly _id: AggregateId;
  protected _props: EntityProps;

  protected constructor({ id, props }: CreateEntityProps<EntityProps>) {
    this._id = id;
    this._props = props;
  }

  get id() {
    return this._id;
  }

  getProps() {
    return Object.freeze({
      id: this._id,
      ...this._props,
    });
  }
}
