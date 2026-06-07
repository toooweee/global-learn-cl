import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/libs/auth/decorators/roles.decorator';
import { RequestContextService } from '@/libs/application/context/app-request-context';
import { ApplicationException } from '@/libs/application/exceptions/application.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const role = RequestContextService.getUserRole();
    if (!role || !requiredRoles.includes(role)) {
      throw new ApplicationException(
        'Insufficient permissions',
        403,
        'FORBIDDEN',
      );
    }

    return true;
  }
}
