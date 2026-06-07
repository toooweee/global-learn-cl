import { Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { EnvModule } from '@/infra/env/env.module';
import { CryptoModule } from '@/libs/crypto/crypto.module';
import { TOKEN_REPOSITORY } from '@/modules/identity/token/application/ports/token.repository.port';
import { TokenPrismaRepository } from '@/modules/identity/token/infra/token-prisma.repository';
import { TokenMapper } from '@/modules/identity/token/token.mapper';
import { TokenService } from '@/modules/identity/token/token.service';
import { EnvService } from '@/infra/env/env.service';

const repositories: Provider[] = [
  { provide: TOKEN_REPOSITORY, useClass: TokenPrismaRepository },
];

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    CryptoModule,
    JwtModule.registerAsync({
      global: true,
      imports: [EnvModule],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: envService.get('JWT_ACCESS_TTL'),
        },
      }),
      inject: [EnvService],
    }),
  ],
  providers: [...repositories, TokenMapper, TokenService],
  exports: [TokenService, JwtModule, TOKEN_REPOSITORY],
})
export class TokenModule {}
