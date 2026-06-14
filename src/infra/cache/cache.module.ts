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
          createKeyv(`redis://${env.get('REDIS_IP')}:${env.get('REDIS_PORT')}`),
        ],
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
