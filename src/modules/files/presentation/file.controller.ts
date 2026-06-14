import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { UploadFileCommand } from '@/modules/files/application/commands/upload-file/upload-file.command';
import { DeleteFileCommand } from '@/modules/files/application/commands/delete-file/delete-file.command';
import { FileResponseDto } from '@/modules/files/presentation/dto/file.response.dto';
import { IdRequestDto } from '@/libs/api/dto/id.request.dto';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '@/libs/application/ports/file-storage.port';
import {
  FILE_REPOSITORY,
  type FileRepositoryPort,
} from '@/modules/files/application/ports/file.repository.port';
import { FileMapper } from '@/modules/files/file.mapper';
import { Roles } from '@/libs/auth/decorators/roles.decorator';
import { COURSE_CREATOR_ROLES } from '@/libs/auth/roles.constants';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStoragePort,
    @Inject(FILE_REPOSITORY)
    private readonly fileRepository: FileRepositoryPort,
    private readonly mapper: FileMapper,
  ) {}

  @ApiOperation({ summary: 'Upload a file (images only, max 5 MB)' })
  @ApiCreatedResponse({ type: FileResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new ApplicationException('No file provided', 400, 'FILE_REQUIRED');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new ApplicationException(
        `Invalid file type. Allowed: ${ALLOWED_MIMES.join(', ')}`,
        400,
        'INVALID_FILE_TYPE',
      );
    }

    return this.commandBus.execute<UploadFileCommand, FileResponseDto>(
      new UploadFileCommand({
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
      }),
    );
  }

  @ApiOperation({ summary: 'Get a presigned URL for a file' })
  @ApiOkResponse({ type: FileResponseDto })
  @ApiNotFoundResponse()
  @Get(':id')
  async getSignedUrl(@Param() { id }: IdRequestDto): Promise<FileResponseDto> {
    const fileOption = await this.fileRepository.findById(id);
    if (fileOption.isNone()) {
      throw new ApplicationException('File not found', 404, 'FILE_NOT_FOUND');
    }

    const entity = fileOption.unwrap();
    const { url } = entity.getProps();
    const signedUrl = await this.fileStorage.getSignedUrl(url);
    return new FileResponseDto({ id, url: signedUrl });
  }

  @ApiOperation({ summary: 'Delete a file' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  @Roles(...COURSE_CREATOR_ROLES)
  @Delete(':id')
  async delete(@Param() { id }: IdRequestDto): Promise<void> {
    await this.commandBus.execute<DeleteFileCommand, void>(
      new DeleteFileCommand({ fileId: id }),
    );
  }
}
