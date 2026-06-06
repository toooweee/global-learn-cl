import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

const swaggerConfig = new DocumentBuilder()
  .setTitle('Global Learn')
  .setDescription("Global Learn's platform api documentation")
  .setVersion('1.0')
  .build();

export const setupSwagger = (app: INestApplication) => {
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
