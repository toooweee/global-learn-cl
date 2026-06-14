import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { extractWsToken } from './ws-auth';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
export class OnboardingChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = extractWsToken(client);
      if (!token) {
        client.disconnect();
        return;
      }
      this.jwtService.verify(token);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket): void {}

  // Rooms are keyed by onboardingId (chat is 1:1 with an onboarding), which is
  // the only id the client knows — the internal chatId is never exposed to it.
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    client: Socket,
    payload: { onboardingId: string },
  ): Promise<void> {
    if (payload?.onboardingId) {
      await client.join(`chat:${payload.onboardingId}`);
    }
  }

  sendToChat(
    onboardingId: string,
    message: { id: string; senderId: string; body: string; createdAt: Date },
  ): void {
    // Include onboardingId in the payload so the client can attribute the
    // message to the right onboarding even when subscribed to several chats.
    this.server
      .to(`chat:${onboardingId}`)
      .emit('message:created', { onboardingId, ...message });
  }
}
