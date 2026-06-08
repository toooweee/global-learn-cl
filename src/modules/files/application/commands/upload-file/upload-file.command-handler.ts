import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UploadFileCommand } from './upload-file.command';
import { FileEntity } from '@/modules/files/domain/file.entity';
import {
  FILE_REPOSITORY,
  type FileRepositoryPort,
} from '@/modules/files/application/ports/file.repository.port';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '@/libs/application/ports/file-storage.port';
import { FileMapper } from '@/modules/files/file.mapper';
import { FileResponseDto } from '@/modules/files/presentation/dto/file.response.dto';

@CommandHandler(UploadFileCommand)
export class UploadFileCommandHandler implements ICommandHandler<
  UploadFileCommand,
  FileResponseDto
> {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly fileRepository: FileRepositoryPort,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStoragePort,
    private readonly mapper: FileMapper,
  ) {}

  async execute(command: UploadFileCommand): Promise<FileResponseDto> {
    const publicUrl = await this.fileStorage.upload(
      command.buffer,
      command.filename,
      command.mimeType,
    );

    const entity = FileEntity.create({ url: publicUrl });
    await this.fileRepository.save(entity);

    const signedUrl = await this.fileStorage.getSignedUrl(publicUrl);
    return new FileResponseDto({ id: entity.id, url: signedUrl });
  }
}
