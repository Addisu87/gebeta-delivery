import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { ApiConfigService, AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ApiConfigService,
          useValue: {
            isAuthEnabled: false,
            jwtSecret: '',
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });
});
