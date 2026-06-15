import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { EnvModule } from '@/infra/env/env.module';
import { EnvService } from '@/infra/env/env.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        stores: [
          createKeyv(
            {
              url: `redis://${env.get('REDIS_IP')}:${env.get('REDIS_PORT')}`,
              // Reject commands immediately when the socket is down instead of
              // queueing them forever — a queued command stalls every cached
              // read until it (eventually) connects.
              disableOfflineQueue: true,
              socket: {
                connectTimeout: 1_000,
                // Keep reconnecting with bounded backoff, but a pending
                // reconnect never blocks a command (offline queue is off).
                reconnectStrategy: (retries: number) =>
                  Math.min(200 * (retries + 1), 5_000),
              },
            },
            {
              // Don't crash app boot if Redis is unreachable at startup.
              throwOnConnectError: false,
              // Degrade to no-op on failures; CacheService also guards reads.
              throwOnErrors: false,
              connectionTimeout: 1_000,
            },
          ),
        ],
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
