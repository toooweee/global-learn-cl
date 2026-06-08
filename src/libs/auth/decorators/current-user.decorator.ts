import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '@/libs/application/context/app-request-context';

export interface CurrentUserPayload {
  userId: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): CurrentUserPayload => {
    return {
      userId: RequestContextService.getUserId()!,
      role: RequestContextService.getUserRole()!,
    };
  },
);
