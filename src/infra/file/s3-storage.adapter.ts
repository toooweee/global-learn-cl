import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvService } from '@/infra/env/env.service';
import { FileStoragePort } from '@/libs/application/ports/file-storage.port';

@Injectable()
export class S3StorageAdapter implements FileStoragePort, OnModuleInit {
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly logger = new Logger(S3StorageAdapter.name);

  constructor(
    private readonly s3Client: S3Client,
    private readonly envService: EnvService,
  ) {
    this.bucketName = this.envService.get('MINIO_BUCKET_NAME');
    this.endpoint = this.envService.get('MINIO_ENDPOINT');
  }

  async onModuleInit() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.log(`[MinIO] Bucket "${this.bucketName}" already exists.`);
    } catch (error: unknown) {
      if (error instanceof S3ServiceException) {
        if (
          error.name === 'NotFound' ||
          error.$metadata?.httpStatusCode === 404
        ) {
          this.logger.warn(
            `[MinIO] Bucket "${this.bucketName}" not found. Creating...`,
          );
          try {
            await this.s3Client.send(
              new CreateBucketCommand({ Bucket: this.bucketName }),
            );
            this.logger.log(
              `[MinIO] Bucket "${this.bucketName}" created successfully!`,
            );
          } catch (createError) {
            this.logger.error(
              `[MinIO] Failed to create bucket "${this.bucketName}"`,
              createError,
            );
          }
        } else {
          this.logger.error(
            '[MinIO] Unexpected S3 error during bucket check',
            error,
          );
        }
      } else {
        this.logger.error(
          '[MinIO] Non-S3 error occurred during bucket check',
          error,
        );
      }
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    const fileKey = `${Date.now()}-${filename}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file,
        ContentType: mimeType,
      }),
    );
    return this.buildPublicUrl(fileKey);
  }

  async delete(publicUrl: string): Promise<void> {
    const fileKey = this.extractKey(publicUrl);
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: fileKey }),
    );
  }

  async getSignedUrl(publicUrl: string): Promise<string> {
    const fileKey = this.extractKey(publicUrl);
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey }),
      { expiresIn: 3600 },
    );
  }

  private buildPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucketName}/${key}`;
  }

  private extractKey(publicUrl: string): string {
    const prefix = `${this.endpoint}/${this.bucketName}/`;
    return publicUrl.replace(prefix, '');
  }
}
