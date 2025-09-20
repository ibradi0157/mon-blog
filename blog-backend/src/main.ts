import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  const isProd = process.env.NODE_ENV === 'production';

  // Session middleware is applied via SecurityModule to ensure proper DI and avoid `this` binding issues

  // CORS
  const explicitOrigins = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedOrigins = new Set<string>([
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    ...explicitOrigins,
  ]);
  const devOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1|10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3})\.(?:\d{1,3})|172\.(?:1[6-9]|2\d|3[0-1])\.(?:\d{1,3})\.(?:\d{1,3})):\d+$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (!isProd && devOriginRegex.test(origin)) return callback(null, true);
      if (!isProd) console.warn('[CORS] Origin non autorisée:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'X-Filename',
      'X-CSRF-Token',
    ],
    maxAge: 86400,
    optionsSuccessStatus: 204,
    preflightContinue: false,
  });

  // Increase body size limits for rich text/HTML payloads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
  app.use(
    helmet({
      // Swagger UI utilise des scripts inline; désactiver CSP en dev évite la page blanche
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'", 'https:'],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"]
        }
      },
      // Activer crossOriginEmbedderPolicy en production uniquement
      crossOriginEmbedderPolicy: isProd,
      // Autres paramètres de sécurité
      crossOriginResourcePolicy: { policy: isProd ? "same-origin" : "cross-origin" },
      crossOriginOpenerPolicy: { policy: isProd ? "same-origin" : "unsafe-none" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      strictTransportSecurity: isProd ? {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true
      } : false
    }),
  );

  // Serve static files for uploads (allow cross-origin embedding)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      // Allow pages from other origins (e.g., Next frontend) to embed these images
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      // Optionally expose for browsers doing preflights (not strictly required for <img>)
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('API documentation for the blog backend')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`Server listening on http://${host}:${port}`);
}
// Process-level guards
process.on('unhandledRejection', (reason: any) => {
  const logger = new Logger('Process');
  try {
    logger.error(`[unhandledRejection] ${reason?.message || reason}`, (reason?.stack || undefined) as any);
  } catch {}
});
process.on('uncaughtException', (err: any) => {
  const logger = new Logger('Process');
  try {
    logger.error(`[uncaughtException] ${err?.message || err}`, (err?.stack || undefined) as any);
  } catch {}
});

bootstrap();
