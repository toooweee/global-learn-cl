import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { cookieFactory } from '@/libs/api/cookie/cookie-factory';

export const Cookies = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    const cookies = cookieFactory(req, res);

    return cookies.get(data);
  },
);
