import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestScope');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest();
    const reqId = req?.id as string | undefined;

    const handler = context.getHandler();
    const controller = context.getClass();
    const meta = {
      reqId,
      controller: controller?.name,
      handler: handler?.name,
    };

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.debug(
          JSON.stringify({ ...meta, event: 'handler_complete', durationMs: duration })
        );
      }),
      catchError((err) => {
        const duration = Date.now() - now;
        // Log and rethrow so the global filters can format the response
        this.logger.error(
          JSON.stringify({
            ...meta,
            event: 'handler_error',
            durationMs: duration,
            message: err?.message,
            name: err?.name,
            status: err?.status,
          })
        );
        throw err;
      })
    );
  }
}
