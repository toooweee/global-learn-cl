import { Module } from '@nestjs/common';
import { EnvModule } from '@/infra/env/env.module';
import { MailService } from './mail.service';

@Module({
  imports: [EnvModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
