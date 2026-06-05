import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
})
export class UserModule {}
