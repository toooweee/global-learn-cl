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

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
export class OnboardingChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
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

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    client: Socket,
    payload: { chatId: string },
  ): Promise<void> {
    if (payload?.chatId) {
      await client.join(`chat:${payload.chatId}`);
    }
  }

  sendToChat(
    chatId: string,
    message: { id: string; senderId: string; body: string; createdAt: Date },
  ): void {
    this.server.to(`chat:${chatId}`).emit('message:created', message);
  }
}
