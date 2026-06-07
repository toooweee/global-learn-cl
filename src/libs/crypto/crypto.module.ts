import { Module } from '@nestjs/common';
import { PasswordService } from '@/libs/crypto/password.service';

@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class CryptoModule {}
