import { Option } from 'oxide.ts';
import { FileEntity } from '@/modules/files/domain/file.entity';

export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');

export interface FileRepositoryPort {
  save(entity: FileEntity): Promise<void>;
  findById(id: string): Promise<Option<FileEntity>>;
  delete(id: string): Promise<void>;
}
