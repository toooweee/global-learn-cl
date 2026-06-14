import { Controller, Get } from '@nestjs/common';
import { Public } from '@/libs/auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
