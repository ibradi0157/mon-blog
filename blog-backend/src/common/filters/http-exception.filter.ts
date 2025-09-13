import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const resp = exception.getResponse() as any;
    const payload = typeof resp === 'object' && resp !== null ? resp : { message: resp };
    const message = (payload as any)?.message ?? exception.message;

    response.status(status).json({
      success: false,
      statusCode: status,
      ...payload,
      message,
    });
  }
}