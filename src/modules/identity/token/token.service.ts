import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { EnvService } from '@/infra/env/env.service';
import { PasswordService } from '@/libs/crypto/password.service';
import {
  TOKEN_REPOSITORY,
  type TokenRepositoryPort,
} from '@/modules/identity/token/application/ports/token.repository.port';
import { TokenEntity } from '@/modules/identity/token/domain/token.entity';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

export interface JwtPayload {
  sub: string;
  role: string;
}

export interface TokenIssuance {
  userId: string;
  accessToken: string;
  accessTokenMaxAge: number;
  refreshTokenCookie: string;
  refreshTokenMaxAge: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
    private readonly passwordService: PasswordService,
    @Inject(TOKEN_REPOSITORY)
    private readonly tokenRepository: TokenRepositoryPort,
  ) {}

  async issueTokenPair(
    userId: string,
    role: string,
    userAgent: string,
  ): Promise<TokenIssuance> {
    const accessTtl = this.envService.get('JWT_ACCESS_TTL');
    const refreshTtl = this.envService.get('JWT_REFRESH_TTL');

    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      role,
    } satisfies JwtPayload);

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = await this.passwordService.hash(rawToken);
    const refreshTokenCookie = `${userId}.${rawToken}`;

    const expiresAt = new Date(Date.now() + refreshTtl * 1000);
    const tokenEntity = TokenEntity.create({
      userId,
      hashedToken,
      userAgent,
      expiresAt,
    });
    await this.tokenRepository.upsertByUserAndAgent(tokenEntity);

    return {
      userId,
      accessToken,
      accessTokenMaxAge: accessTtl * 1000,
      refreshTokenCookie,
      refreshTokenMaxAge: refreshTtl * 1000,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new ApplicationException(
        'Invalid access token',
        401,
        'UNAUTHORIZED',
      );
    }
  }

  async verifyRefreshCookie(
    refreshTokenCookie: string,
    userAgent: string,
  ): Promise<string> {
    const dotIndex = refreshTokenCookie.indexOf('.');
    if (dotIndex === -1) {
      throw new ApplicationException(
        'Malformed refresh token',
        401,
        'REFRESH_TOKEN_INVALID',
      );
    }

    const userId = refreshTokenCookie.slice(0, dotIndex);
    const rawToken = refreshTokenCookie.slice(dotIndex + 1);

    const tokenOption = await this.tokenRepository.findByUserAndAgent(
      userId,
      userAgent,
    );
    if (tokenOption.isNone()) {
      throw new ApplicationException(
        'Refresh token not found',
        401,
        'REFRESH_TOKEN_NOT_FOUND',
      );
    }

    const token = tokenOption.unwrap();
    const props = token.getProps();

    if (props.expiresAt < new Date()) {
      throw new ApplicationException(
        'Refresh token expired',
        401,
        'REFRESH_TOKEN_EXPIRED',
      );
    }

    const valid = await this.passwordService.verify(
      props.hashedToken,
      rawToken,
    );
    if (!valid) {
      throw new ApplicationException(
        'Invalid refresh token',
        401,
        'REFRESH_TOKEN_INVALID',
      );
    }

    return userId;
  }
}
