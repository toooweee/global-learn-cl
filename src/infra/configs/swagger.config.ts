import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

interface SwaggerRequest {
  credentials?: 'omit' | 'same-origin' | 'include';
  [key: string]: unknown;
}

const swaggerConfig = new DocumentBuilder()
  .setTitle('Global Learn')
  .setDescription("Global Learn's platform api documentation")
  .setVersion('1.0')
  .addCookieAuth('access_token', {
    type: 'apiKey',
    in: 'cookie',
    name: 'access_token',
  })
  .build();

export const setupSwagger = (app: INestApplication): void => {
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (req: SwaggerRequest): SwaggerRequest => {
        req.credentials = 'include';
        return req;
      },
    },
  });
};
