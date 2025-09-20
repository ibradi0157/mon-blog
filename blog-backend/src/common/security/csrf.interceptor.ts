import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import Tokens from 'csrf';

@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  private tokens = new Tokens();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const isDev = process.env.NODE_ENV !== 'production';

    // ⚠️ On ne désactive plus le CSRF en dev
    // On log juste plus d'infos pour debug
    if (!request.session) {
      console.warn('[CSRF] No session found');
      throw new ForbiddenException('Session not initialized');
    }

    // Génération du secret si absent
    if (!request.session.csrfSecret) {
      request.session.csrfSecret = this.tokens.secretSync();
      request.session.csrfToken = undefined;
    }

    // Génération du token stable
    if (!request.session.csrfToken) {
      request.session.csrfToken = this.tokens.create(request.session.csrfSecret);
    }

    // Log debug
    if (isDev) {
      console.log('[CSRF] Session debug:', {
        method: request.method,
        url: request.originalUrl || request.url,
        sessionId: (request as any).sessionID,
        cookieHeader: request.headers.cookie ? 'present' : 'missing',
        hasSecret: Boolean(request.session?.csrfSecret),
        hasToken: Boolean(request.session?.csrfToken),
        tokenInSession: request.session?.csrfToken ? String(request.session.csrfToken).slice(0, 8) + '…' : undefined,
      });
    }

    // GET → on renvoie le token
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      response.header('X-CSRF-Token', request.session.csrfToken);
      return next.handle();
    }

    // POST/PUT/DELETE → on vérifie
    const csrfToken = request.headers['x-csrf-token'] ||
                     request.headers['x-xsrf-token'] ||
                     request.body?._csrf;

    const tokenMatches = request.session?.csrfToken === csrfToken;

    if (tokenMatches || (csrfToken && this.tokens.verify(request.session.csrfSecret, csrfToken))) {
      response.header('X-CSRF-Token', request.session.csrfToken);
      return next.handle();
    }

    console.warn('[CSRF] Invalid token', {
      method: request.method,
      url: request.originalUrl || request.url,
      hasSecret: Boolean(request.session?.csrfSecret),
      storedToken: request.session?.csrfToken ? String(request.session.csrfToken).slice(0, 8) + '…' : undefined,
      receivedToken: csrfToken ? String(csrfToken).slice(0, 8) + '…' : undefined,
      tokensMatch: tokenMatches,
      reason: !csrfToken ? 'missing' : 'mismatch'
    });

    throw new ForbiddenException('Invalid CSRF token');
  }
}