import { randomUUID } from 'node:crypto';
import { Entity, CreateEntityProps } from '@/libs/ddd/entity.base';
import type { CreateFileProps, FileProps } from '@/modules/files/file.types';

export class FileEntity extends Entity<FileProps> {
  protected constructor(props: CreateEntityProps<FileProps>) {
    super(props);
  }

  static create(createProps: CreateFileProps): FileEntity {
    return new FileEntity({ id: randomUUID(), props: { ...createProps } });
  }

  static recreate(props: { id: string; props: FileProps }): FileEntity {
    return new FileEntity(props);
  }
}
