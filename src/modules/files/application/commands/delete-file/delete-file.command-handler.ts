import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteFileCommand } from './delete-file.command';
import {
  FILE_REPOSITORY,
  type FileRepositoryPort,
} from '@/modules/files/application/ports/file.repository.port';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '@/libs/application/ports/file-storage.port';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@CommandHandler(DeleteFileCommand)
export class DeleteFileCommandHandler implements ICommandHandler<
  DeleteFileCommand,
  void
> {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly fileRepository: FileRepositoryPort,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStoragePort,
  ) {}

  async execute(command: DeleteFileCommand): Promise<void> {
    const fileOption = await this.fileRepository.findById(command.fileId);
    if (fileOption.isNone()) {
      throw new ApplicationException('File not found', 404, 'FILE_NOT_FOUND');
    }

    const file = fileOption.unwrap();
    const { url } = file.getProps();

    await this.fileStorage.delete(url);
    await this.fileRepository.delete(command.fileId);
  }
}
