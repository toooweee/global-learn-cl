import { randomUUID } from 'node:crypto';
import { AggregateId, CreateEntityProps, Entity } from '@/libs/ddd/entity.base';
import { DomainException } from '@/libs/ddd/domain.exception';
import {
  AddModuleProps,
  AddStepProps,
  CourseProps,
  CreateCourseProps,
  ModuleProps,
  UpdateCourseMetadataProps,
} from '@/modules/education/course/course.types';

export class CourseEntity extends Entity<CourseProps> {
  protected constructor(props: CreateEntityProps<CourseProps>) {
    super(props);
  }

  static create(props: CreateCourseProps): CourseEntity {
    return new CourseEntity({
      id: randomUUID(),
      props: {
        ...props,
        modules: [],
        createdAt: new Date(),
      },
    });
  }

  static recreate(params: {
    id: AggregateId;
    props: CourseProps;
  }): CourseEntity {
    return new CourseEntity(params);
  }

  updateMetadata(updates: UpdateCourseMetadataProps): void {
    if (updates.name !== undefined) this._props.name = updates.name;
    if (updates.description !== undefined)
      this._props.description = updates.description;
    if ('coverId' in updates) {
      this._props.coverId = updates.coverId ?? undefined;
    }
    this._props.updatedAt = new Date();
  }

  addModule(props: AddModuleProps): string {
    const position =
      this._props.modules.length === 0
        ? 1
        : Math.max(...this._props.modules.map((m) => m.position)) + 1;
    const id = randomUUID();
    this._props.modules.push({ id, name: props.name, position, steps: [] });
    return id;
  }

  removeModule(moduleId: string): void {
    const idx = this._props.modules.findIndex((m) => m.id === moduleId);
    if (idx === -1) {
      throw new DomainException(
        `Module ${moduleId} not found`,
        'COURSE_MODULE_NOT_FOUND',
      );
    }
    this._props.modules.splice(idx, 1);
    this._reindexModules();
  }

  addStep(props: AddStepProps): string {
    const module = this._findModule(props.moduleId);
    const position =
      module.steps.length === 0
        ? 1
        : Math.max(...module.steps.map((s) => s.position)) + 1;
    const id = randomUUID();
    module.steps.push({
      id,
      name: props.name,
      position,
      type: props.type,
      lessonId: props.lessonId,
      testId: props.testId,
    });
    return id;
  }

  removeStep(moduleId: string, stepId: string): void {
    const module = this._findModule(moduleId);
    const idx = module.steps.findIndex((s) => s.id === stepId);
    if (idx === -1) {
      throw new DomainException(
        `Step ${stepId} not found`,
        'COURSE_STEP_NOT_FOUND',
      );
    }
    module.steps.splice(idx, 1);
    this._reindexSteps(module);
  }

  private _findModule(moduleId: string): ModuleProps {
    const module = this._props.modules.find((m) => m.id === moduleId);
    if (!module) {
      throw new DomainException(
        `Module ${moduleId} not found`,
        'COURSE_MODULE_NOT_FOUND',
      );
    }
    return module;
  }

  private _reindexModules(): void {
    this._props.modules.forEach((m, i) => {
      m.position = i + 1;
    });
  }

  private _reindexSteps(module: ModuleProps): void {
    module.steps.forEach((s, i) => {
      s.position = i + 1;
    });
  }
}
