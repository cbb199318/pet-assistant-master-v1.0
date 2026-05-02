import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { mkdirSync } from 'fs';
import { UPLOAD_ROOT } from './ai/ai.constants';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置CORS
  app.enableCors({
    origin: '*', // 在生产环境中应该设置具体的前端域名
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  mkdirSync(UPLOAD_ROOT, { recursive: true });
  app.use('/uploads', express.static(UPLOAD_ROOT));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
