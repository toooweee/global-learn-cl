import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@generated/client';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { NotificationsGateway } from '@/infra/gateway/notifications.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async notify(
    userId: string,
    type: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const record = await this.prismaService.client.notification.create({
      data: {
        id: randomUUID(),
        userId,
        type,
        payload: payload as Prisma.InputJsonValue | undefined,
      },
    });
    this.gateway.sendToUser(userId, 'notification:created', {
      id: record.id,
      type: record.type,
      payload: record.payload,
      createdAt: record.createdAt,
    });
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.prismaService.client.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prismaService.client.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async findByUser(userId: string, limit = 20, offset = 0) {
    return this.prismaService.client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prismaService.client.notification.count({ where: { userId } });
  }
}
