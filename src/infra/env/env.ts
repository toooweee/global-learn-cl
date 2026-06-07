import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number(),

  REDIS_IP: z.string(),
  REDIS_PORT: z.coerce.number(),

  DATABASE_URL: z.string(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),

  TEST_ADMIN_EMAIL: z.string(),
  TEST_ADMIN_PASSWORD: z.string(),

  MINIO_ENDPOINT: z.string(),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),
  MINIO_BUCKET_NAME: z.string().min(1),
  MINIO_REGION: z.string().default('us-east-1'),
});

export type Env = z.infer<typeof EnvSchema>;
