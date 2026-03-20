import { type ConfigFactory } from '@nestjs/config';
import { databaseConfig } from './database.config';

export const configuration: ConfigFactory[] = [databaseConfig];
