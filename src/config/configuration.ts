import { type ConfigFactory } from '@nestjs/config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';

export const configuration: ConfigFactory[] = [databaseConfig, redisConfig];
