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
});

export type Env = z.infer<typeof EnvSchema>;
