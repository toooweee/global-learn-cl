import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvModule } from '@/infra/env/env.module';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { RequestContextModule } from 'nestjs-request-context';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ContextInterceptor } from '@/libs/application/context/context.interceptor';
import { UserModule } from '@/modules/identity/user/user.module';
import { OnboardingModule } from '@/modules/onboarding/onboarding.module';
import { CqrsModule } from '@nestjs/cqrs';

const interceptors = [
  {
    provide: APP_INTERCEPTOR,
    useClass: ContextInterceptor,
  },
];

@Module({
  imports: [
    CqrsModule.forRoot(),
    RequestContextModule,
    EnvModule,
    PrismaModule,
    UserModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [...interceptors],
})
export class AppModule {}
