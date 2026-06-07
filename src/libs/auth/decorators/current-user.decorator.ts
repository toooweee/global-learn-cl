import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '@/libs/application/context/app-request-context';

export interface CurrentUserPayload {
  userId: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_data: unknown, _ctx: ExecutionContext): CurrentUserPayload => {
    return {
      userId: RequestContextService.getUserId()!,
      role: RequestContextService.getUserRole()!,
    };
  },
);
