import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { WinstonLoggerService } from '../logger/winston.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const { method, originalUrl } = request;

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        this.logger.log(
          `${method} ${originalUrl} ${elapsed}ms`,
          'LoggingInterceptor',
        );
      }),
    );
  }
}
