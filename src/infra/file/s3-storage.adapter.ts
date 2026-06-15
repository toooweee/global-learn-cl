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
  // Browser-reachable base URL: links are built and signed against this host so
  // a presigned URL opens in the browser (SigV4 signs the host, which must
  // match what MinIO sees through the reverse proxy).
  private readonly publicEndpoint: string;
  // Separate client whose endpoint is the public URL — used ONLY to sign
  // download links. Object operations still go through the injected (internal)
  // client, so the API never has to hairpin out through the public host.
  private readonly presignClient: S3Client;
  private readonly logger = new Logger(S3StorageAdapter.name);

  constructor(
    private readonly s3Client: S3Client,
    private readonly envService: EnvService,
  ) {
    this.bucketName = this.envService.get('MINIO_BUCKET_NAME');
    this.publicEndpoint =
      this.envService.get('MINIO_PUBLIC_URL') ??
      this.envService.get('MINIO_ENDPOINT');
    this.presignClient = new S3Client({
      region: this.envService.get('MINIO_REGION'),
      endpoint: this.publicEndpoint,
      credentials: {
        accessKeyId: this.envService.get('MINIO_ROOT_USER'),
        secretAccessKey: this.envService.get('MINIO_ROOT_PASSWORD'),
      },
      forcePathStyle: true,
    });
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
      this.presignClient,
      new GetObjectCommand({ Bucket: this.bucketName, Key: fileKey }),
      { expiresIn: 3600 },
    );
  }

  private buildPublicUrl(key: string): string {
    return `${this.publicEndpoint}/${this.bucketName}/${key}`;
  }

  private extractKey(publicUrl: string): string {
    // Host-agnostic: take everything after `/<bucket>/`, so links stored with
    // an older endpoint (e.g. internal http://minio:9000) still resolve.
    const marker = `/${this.bucketName}/`;
    const idx = publicUrl.indexOf(marker);
    return idx >= 0 ? publicUrl.slice(idx + marker.length) : publicUrl;
  }
}
