import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule as BaseThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommentsModule } from './comments/comments.module';
import { CategoriesModule } from './categories/categories.module';
import { ArticleStatsModule } from './articles/article-stats.module';
import { LikesModule } from './likes/likes.module';
import { HomepageModule } from './homepage/homepage.module';
import { LegalModule } from './legal/legal.module.js';
import { CacheModule as CustomCacheModule } from './common/cache/cache.module';
import { SecurityModule } from './common/security/security.module';
import { SeoModule } from './common/seo/seo.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [    
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        }),
        ttl: 60, // seconds
      }),
    }),

    // Configuration de TypeORM avec la variable d'environnement DATABASE_URL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        schema: 'public',
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production', // ⚠️ seulement en dev !
      }),
    }),
    HealthModule,
    ArticleStatsModule,
    ArticlesModule,
    AuthModule,
    UsersModule,
    CommentsModule,
    CategoriesModule,
    LikesModule,
    HomepageModule,
    LegalModule,
    CustomCacheModule,
    SecurityModule,
    SeoModule,
    AnalyticsModule,
    BaseThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 100 }] })
   
    // autres modules...
    ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
