import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare module 'http' {
  interface IncomingMessage {
    id?: string;
    startTime?: number;
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerId = String(req.header('x-request-id') || req.header('X-Request-Id') || '').trim();
    const id = headerId || randomUUID();
    (req as any).id = id;
    (req as any).startTime = Date.now();
    res.setHeader('X-Request-Id', id);
    next();
  }
}
