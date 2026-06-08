import { Injectable } from '@nestjs/common';
import { Mapper } from '@/libs/ddd/mapper.interface';
import { FileEntity } from '@/modules/files/domain/file.entity';
import { FileResponseDto } from '@/modules/files/presentation/dto/file.response.dto';
import type { File as FileRecord } from '@generated/client';

@Injectable()
export class FileMapper implements Mapper<
  FileEntity,
  FileRecord,
  FileResponseDto
> {
  toDomain(record: FileRecord): FileEntity {
    return FileEntity.recreate({ id: record.id, props: { url: record.url } });
  }

  toPersistence(entity: FileEntity): FileRecord {
    const props = entity.getProps();
    return { id: props.id, url: props.url };
  }

  toResponse(entity: FileEntity): FileResponseDto {
    const props = entity.getProps();
    return new FileResponseDto({ id: props.id, url: props.url });
  }
}
