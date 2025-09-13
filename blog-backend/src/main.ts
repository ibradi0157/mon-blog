import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Increase body size limits for rich text/HTML payloads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
  // Configuration CORS pour accepter les requêtes du frontend et des appareils mobiles
  const allowedOrigins = [
    'http://localhost:3001',
    'http://192.168.0.113:3001',
    // Ajoutez d'autres origines si nécessaire
  ];

  app.enableCors({
    origin: true, // Allow all origins for now
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Viewer-Id',
      'Content-Disposition',
      'X-Requested-With'
    ],
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'X-Filename'
    ]
  });
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      // Swagger UI utilise des scripts inline; désactiver CSP en dev évite la page blanche
      contentSecurityPolicy: isProd ? undefined : false,
      // Peut bloquer certains chargements d'assets (ex: Swagger)
      crossOriginEmbedderPolicy: false,
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
}
bootstrap();
