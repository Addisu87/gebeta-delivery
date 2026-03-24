import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    forgotPassword: vi.fn(),
    changePassword: vi.fn(),
    resetPassword: vi.fn(),
    sendVerification: vi.fn(),
    verifyEmail: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: vi.fn().mockReturnValue(true) },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: vi.fn() },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: vi.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
