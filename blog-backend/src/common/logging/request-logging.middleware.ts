import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const reqId = (req as any).id as string | undefined;
    const ua = req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      // Structured log line
      this.logger.log(
        JSON.stringify({
          reqId,
          method,
          url,
          statusCode,
          durationMs: duration,
          ip,
          ua,
        })
      );
    });

    next();
  }
}
