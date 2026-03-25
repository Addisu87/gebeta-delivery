import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EMAIL_QUEUE } from 'src/shared/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  const usersServiceMock = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
  };
  const jwtServiceMock = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };
  const emailQueueMock = { add: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: getQueueToken(EMAIL_QUEUE),
          useValue: emailQueueMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
