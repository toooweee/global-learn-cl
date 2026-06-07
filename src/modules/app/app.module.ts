import { Module, Provider } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvModule } from '@/infra/env/env.module';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { RequestContextModule } from 'nestjs-request-context';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ContextInterceptor } from '@/libs/application/context/context.interceptor';
import { UserModule } from '@/modules/identity/user/user.module';
import { OnboardingModule } from '@/modules/onboarding/onboarding.module';
import { AuthModule } from '@/modules/identity/auth/auth.module';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { EmployeeModule } from '@/modules/employee/employee.module';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AllExceptionsFilter } from '@/infra/exception-filters/all-exceptions.filter';
import { JwtAuthGuard } from '@/libs/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/libs/auth/guards/roles.guard';

const interceptors: Provider[] = [
  { provide: APP_INTERCEPTOR, useClass: ContextInterceptor },
];

const exceptionFilters: Provider[] = [
  { provide: APP_FILTER, useClass: AllExceptionsFilter },
];

const guards: Provider[] = [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
];

@Module({
  imports: [
    CqrsModule.forRoot(),
    RequestContextModule,
    EnvModule,
    PrismaModule,
    JwtModule.register({}),
    UserModule,
    AuthModule,
    OrganizationModule,
    EmployeeModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [...interceptors, ...exceptionFilters, ...guards],
})
export class AppModule {}
