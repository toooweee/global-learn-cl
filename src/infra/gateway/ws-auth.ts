import type { Socket } from 'socket.io';
import { cookieConstants } from '@/libs/api/decorators/cookie.constants';

/**
 * Resolves the JWT for a WebSocket handshake. Auth is cookie-based (httpOnly),
 * so the browser can't put the token in `handshake.auth.token` — we read the
 * `access_token` cookie from the upgrade request headers. Falls back to
 * `handshake.auth.token` for non-browser clients (tests, mobile).
 */
export function extractWsToken(client: Socket): string | undefined {
  const authToken = client.handshake.auth?.token as string | undefined;
  if (authToken) return authToken;

  const cookieHeader = client.handshake.headers?.cookie;
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === cookieConstants.ACCESS_TOKEN) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}
