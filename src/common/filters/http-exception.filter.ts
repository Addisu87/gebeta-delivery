import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WinstonLoggerService } from '../logger/winston.logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? (payload as { message: string | string[] }).message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    this.logger.error(
      `HTTP ${status} ${request.method} ${request.url} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
      'HttpExceptionFilter',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
