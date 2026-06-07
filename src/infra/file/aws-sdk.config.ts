import { EnvService } from '@/infra/env/env.service';
import { S3Client } from '@aws-sdk/client-s3';

export const awsSdkConfig = (envService: EnvService) => {
  return new S3Client({
    region: envService.get('MINIO_REGION'),
    endpoint: envService.get('MINIO_ENDPOINT'),
    credentials: {
      accessKeyId: envService.get('MINIO_ROOT_USER'),
      secretAccessKey: envService.get('MINIO_ROOT_PASSWORD'),
    },
    forcePathStyle: true,
  });
};
