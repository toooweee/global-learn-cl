import { Injectable } from '@nestjs/common';
import { None, Option, Some } from 'oxide.ts';
import { PrismaRepositoryBase } from '@/infra/prisma/prisma.repository.base';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { FileRepositoryPort } from '@/modules/files/application/ports/file.repository.port';
import { FileEntity } from '@/modules/files/domain/file.entity';
import { FileMapper } from '@/modules/files/file.mapper';

@Injectable()
export class FilePrismaRepository
  extends PrismaRepositoryBase
  implements FileRepositoryPort
{
  constructor(
    prismaService: PrismaService,
    private readonly mapper: FileMapper,
  ) {
    super(prismaService);
  }

  async save(entity: FileEntity): Promise<void> {
    const data = this.mapper.toPersistence(entity);
    await this.db.file.create({ data });
  }

  async findById(id: string): Promise<Option<FileEntity>> {
    const record = await this.db.file.findUnique({ where: { id } });
    return record ? Some(this.mapper.toDomain(record)) : None;
  }

  async delete(id: string): Promise<void> {
    await this.db.file.delete({ where: { id } });
  }
}
