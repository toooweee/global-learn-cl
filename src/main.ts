import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@/modules/app/app.module';
import { EnvService } from '@/infra/env/env.service';
import { setupSwagger } from '@/infra/configs/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const envService = app.get(EnvService);
  setupSwagger(app);
  await app.listen(envService.get('PORT'), '0.0.0.0');
}
bootstrap();
