import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '@/libs/auth/decorators/public.decorator';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';
import type { JwtPayload } from '@/modules/identity/token/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ cookies?: Record<string, string> }>();
    const token = request.cookies?.['access_token'];

    if (!token) {
      throw new ApplicationException('No token provided', 401, 'UNAUTHORIZED');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      RequestContextService.setUserId(payload.sub);
      RequestContextService.setUserRole(payload.role);
      return true;
    } catch {
      throw new ApplicationException(
        'Invalid or expired token',
        401,
        'UNAUTHORIZED',
      );
    }
  }
}
