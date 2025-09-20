import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const resp = exception.getResponse() as any;
    const payload = typeof resp === 'object' && resp !== null ? resp : { message: resp };
    const message = (payload as any)?.message ?? exception.message;
    const reqId = (request as any)?.id as string | undefined;

    // Structured error log
    try {
      const logger = new Logger('HttpException');
      logger.error(
        JSON.stringify({
          reqId,
          method: request.method,
          path: request.originalUrl || request.url,
          statusCode: status,
          message,
          name: (exception as any)?.name,
        })
      );
    } catch {}

    response.status(status).json({
      success: false,
      statusCode: status,
      ...payload,
      message,
      request: {
        method: request.method,
        path: request.originalUrl || request.url,
        query: request.query,
      },
    });
  }
}