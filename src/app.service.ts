import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }

  get jwtSecret(): string {
    return this.configService.get('JWT_ACCESS_SECRET') ?? '';
  }
}

@Injectable()
export class AppService {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  get authEnabled(): boolean {
    return this.apiConfigService.isAuthEnabled;
  }
}
