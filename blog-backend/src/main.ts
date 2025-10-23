import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
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

  // 🌍 Définition des origines autorisées
  const explicitOrigins = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins = new Set<string>([
    'https://mon-site.com', // ton domaine principal (frontend prod)
    'https://app.mon-site.com', // si tu as une sous-domaine
    'http://localhost:3001', // pour le dev
    'http://127.0.0.1:3001',
    ...explicitOrigins,
  ]);

  const devOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1|10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3})\.(?:\d{1,3})|172\.(?:1[6-9]|2\d|3[0-1])\.(?:\d{1,3})\.(?:\d{1,3})):\d+$/;

  // 🛡️ Configuration CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (!isProd && devOriginRegex.test(origin)) return callback(null, true);
      if (!isProd) console.warn('[CORS] Origine non autorisée:', origin);
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
  });

  // 🧱 Middleware utiles
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression()); // ➕ compression gzip pour accélérer les réponses

  // ⚙️ Sécurité Helmet
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              fontSrc: ["'self'", 'https:', 'data:'],
              connectSrc: ["'self'", 'https:'],
              mediaSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : false, // Désactivé en dev pour Swagger
      crossOriginEmbedderPolicy: false, // évite les erreurs de chargement cross-domain
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // autorise ton frontend à charger les images
      crossOriginOpenerPolicy: { policy: isProd ? 'same-origin' : 'unsafe-none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      strictTransportSecurity: isProd
        ? {
            maxAge: 63072000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    }),
  );

  // 📁 Fichiers statiques (uploads)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  });

  // 🌐 Préfixe global
  app.setGlobalPrefix('api/v1');

  // ✅ Validation + filtres globaux
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 📘 Swagger (activé uniquement en dev)
  if (!isProd) {
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
  }

  // 🧠 Hooks d'arrêt propre
  app.enableShutdownHooks();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);
  logger.log(`✅ Server listening on http://${host}:${port}`);
}

// 🧯 Gestion erreurs process
process.on('unhandledRejection', (reason: any) => {
  const logger = new Logger('Process');
  logger.error(`[unhandledRejection] ${reason?.message || reason}`, reason?.stack);
});
process.on('uncaughtException', (err: any) => {
  const logger = new Logger('Process');
  logger.error(`[uncaughtException] ${err?.message || err}`, err?.stack);
});

bootstrap();
