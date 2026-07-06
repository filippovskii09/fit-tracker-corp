import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { AppModule } from './app/app.module';
import { FRONTEND_URL, PORT } from './config/constants';
import { DEFAULT_PORT } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'log', 'warn', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);

  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  app.use(cookieParser());
  app.use(helmet());

  const configuredOrigins =
    configService
      .get<string>(FRONTEND_URL)
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3001',
    'https://fit-tracker-corp.netlify.app',
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const isNetlifyPreview =
        /^https:\/\/deploy-preview-\d+--fit-tracker-corp\.netlify\.app$/.test(
          origin,
        );

      if (isNetlifyPreview) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>(PORT) || DEFAULT_PORT;

  await app.listen(port);

  if (process.env.NODE_ENV === 'production') {
    Logger.log(`Application is running (Production)`);
  } else {
    Logger.log(
      `Application is running on: http://localhost:${port}/${globalPrefix}`,
    );
  }
}

bootstrap();
