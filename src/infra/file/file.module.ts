import { Module, Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { EnvService } from '@/infra/env/env.service';
import { EnvModule } from '@/infra/env/env.module';
import { S3StorageAdapter } from './s3-storage.adapter';
import { awsSdkConfig } from './aws-sdk.config';
import { FILE_STORAGE } from '@/libs/application/ports/file-storage.port';

const s3ClientProvider: Provider = {
  provide: S3Client,
  useFactory: (envService: EnvService) => awsSdkConfig(envService),
  inject: [EnvService],
};

const storageProvider: Provider = {
  provide: FILE_STORAGE,
  useClass: S3StorageAdapter,
};

@Module({
  imports: [EnvModule],
  providers: [s3ClientProvider, storageProvider],
  exports: [FILE_STORAGE],
})
export class FileModule {}
