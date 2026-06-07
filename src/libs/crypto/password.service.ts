import { Injectable } from '@nestjs/common';
import * as argon from 'argon2';

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon.hash(plain);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon.verify(hash, plain);
  }
}
