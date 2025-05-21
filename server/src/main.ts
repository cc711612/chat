global.crypto = require('crypto');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('server.port') ?? 3001;

  // 從環境配置中獲取 CORS 設定
  const corsEnabled = configService.get('cors.enabled');
  console.log('CORS_ENABLED value from configService:', corsEnabled);
  if (corsEnabled) {
    let origin = configService.get('cors.origin');
    // 若設為 * 則全開
    if (origin === '*' || origin === true) {
      origin = true;
    }
    app.enableCors({
      origin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: configService.get('cors.credentials'),
    });
    console.log(`CORS enabled with origin: ${origin}`);
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
