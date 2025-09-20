import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Force secure=false en dev pour que le cookie soit accepté en HTTP
    let secureOption: boolean | 'auto' = isProduction ? 'auto' : false;

    // SameSite par défaut
    let sameSiteOption: 'lax' | 'strict' | 'none' = 'lax';

    // Middleware de session
    const sessionMiddleware = session({
      secret: this.configService.get('SESSION_SECRET', 'your-secure-session-secret'),
      name: 'blog.sid',
      resave: false,
      saveUninitialized: false, // ⚠️ false pour éviter les sessions fantômes
      cookie: {
        httpOnly: true,
        secure: secureOption,
        maxAge: 24 * 60 * 60 * 1000, // 24h
        sameSite: sameSiteOption,
      },
      store: this.getSessionStore()
    });

    return sessionMiddleware(req, res, next);
  }

  private getSessionStore() {
    try {
      const connectRedis = require('connect-redis');
      let RedisStoreCtor: any = connectRedis?.default || connectRedis?.RedisStore || null;
      if (!RedisStoreCtor && typeof connectRedis === 'function') {
        RedisStoreCtor = connectRedis(session);
      }

      if (RedisStoreCtor) {
        const { createClient } = require('redis');
        const url = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        const redisClient = createClient({ url });
        redisClient.on('error', (e: any) => console.warn('[Session] Redis client error:', e?.message || e));
        redisClient.connect().catch((e: any) => console.warn('[Session] Redis connect error:', e?.message || e));
        console.log('[Session] Using RedisStore');
        return new RedisStoreCtor({
          client: redisClient,
          prefix: 'blog:sess:',
        });
      }
    } catch (err) {
      console.warn('[Session] Redis store init failed, falling back to MemoryStore:', err?.message || err);
    }
    console.warn('[Session] Using MemoryStore (dev only)');
    return undefined;
  }
}