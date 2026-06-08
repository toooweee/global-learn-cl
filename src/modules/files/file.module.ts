import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { FileModule as FileInfraModule } from '@/infra/file/file.module';
import { FILE_REPOSITORY } from '@/modules/files/application/ports/file.repository.port';
import { FilePrismaRepository } from '@/modules/files/infra/file-prisma.repository';
import { FileMapper } from '@/modules/files/file.mapper';
import { UploadFileCommandHandler } from '@/modules/files/application/commands/upload-file/upload-file.command-handler';
import { DeleteFileCommandHandler } from '@/modules/files/application/commands/delete-file/delete-file.command-handler';
import { FileController } from '@/modules/files/presentation/file.controller';

const repositories: Provider[] = [
  { provide: FILE_REPOSITORY, useClass: FilePrismaRepository },
];

const commandHandlers: Provider[] = [
  UploadFileCommandHandler,
  DeleteFileCommandHandler,
];

@Module({
  imports: [PrismaModule, FileInfraModule],
  controllers: [FileController],
  providers: [...repositories, ...commandHandlers, FileMapper],
  exports: [FILE_REPOSITORY],
})
export class FilesModule {}
