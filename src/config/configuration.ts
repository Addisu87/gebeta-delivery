import { type ConfigFactory } from '@nestjs/config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';
import { emailConfig } from './email.config';

export const configuration: ConfigFactory[] = [
  databaseConfig,
  redisConfig,
  emailConfig,
];
