import { Entity } from '@/libs/ddd/entity.base';
import {
  CreateModuleProps,
  ModuleProps,
} from '@/modules/education/module/module.types';
import { randomUUID } from 'node:crypto';

export class ModuleEntity extends Entity<ModuleProps> {
  private constructor(props: CreateModuleProps) {
    super({
      id: randomUUID(),
      props: {
        ...props,
        createdAt: new Date(),
      },
    });
  }

  static create(props: CreateModuleProps) {
    return new ModuleEntity(props);
  }
}
