import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PRISMA');
  readonly client: PrismaClient;

  constructor(envService: EnvService) {
    const adapter = new PrismaPg({
      connectionString: envService.get('DATABASE_URL'),
    });

    this.client = new PrismaClient({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.client.$connect();

    const prismaEventEmitter = this.client as unknown as {
      $on(event: 'query', callback: (e: Prisma.QueryEvent) => void): void;
    };

    prismaEventEmitter.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.log(
        `💾 SQL: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`,
      );
    });
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
