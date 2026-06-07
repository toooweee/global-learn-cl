import { Request, Response } from 'express';

export const cookieFactory = (req: Request, res: Response) => {
  const get = (name: string) => {
    const value = (req.cookies as Record<string, unknown>)[name];
    return typeof value === 'string' ? value : undefined;
  };

  const set = (name: string, value: string, exp?: number) => {
    res.cookie(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: exp ? exp : 1000 * 60 * 60 * 24,
    });
  };

  const remove = (name: string) => {
    res.clearCookie(name);
  };

  return {
    get,
    set,
    remove,
  };
};
