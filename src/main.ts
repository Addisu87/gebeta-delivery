import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WinstonLoggerService } from './common/logger/winston.logger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const shouldPublishGraph = process.env.PUBLISH_GRAPH === 'true';
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    snapshot: true,
    preview: shouldPublishGraph,
  });
  app.useLogger(app.get(WinstonLoggerService));
  app.flushLogs();

  const config = new DocumentBuilder()
    .setTitle('Gebeta Delivery')
    .setDescription('The Gebeta Delivery API description')
    .setVersion('1.0')
    .addTag('Gebeta Delivery')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(app.get(WinstonLoggerService)));
  app.useGlobalInterceptors(new LoggingInterceptor(app.get(WinstonLoggerService)));
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
