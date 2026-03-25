import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from 'src/shared/enums/role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../users/entities/user.entity';
import { EMAIL_QUEUE, JOB_EMAIL_SEND, SALT_ROUNDS } from 'src/shared/constants';

type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue,
  ) {}

  private getBaseUrl(): string {
    return process.env.APP_URL ?? 'http://localhost:3000';
  }

  async register(createAuthDto: RegisterDto) {
    const verificationToken = await this.jwtService.signAsync(
      { email: createAuthDto.email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION as StringValue,
      },
    );

    const user = await this.usersService.create({
      firstName: createAuthDto.firstName,
      lastName: createAuthDto.lastName,
      email: createAuthDto.email,
      password: createAuthDto.password,
      role: createAuthDto.role ?? UserRole.USER,
      isEmailVerified: false,
      verificationToken,
    });

    const verifyUrl = `${this.getBaseUrl()}/verify-email?token=${verificationToken}`;
    await this.emailQueue.add(
      JOB_EMAIL_SEND,
      {
        notificationId: `auth-verify:${user.id}`,
        to: user.email,
        subject: 'Verify your email',
        body: `Click to verify: ${verifyUrl}`,
      },
      { jobId: `auth-verify:${user.id}` },
    );

    const { password, refreshToken, verificationToken: _verificationToken, ...safeUser } = user;

    return {
      message: 'Registration successful',
      user: safeUser,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  private async generateTokens(user: Pick<User, 'id' | 'email' | 'role'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION as StringValue,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async verifyEmail(token: string) {
    const payload = await this.jwtService.verifyAsync<{ email: string }>(
      token,
      { secret: process.env.JWT_ACCESS_SECRET },
    );
    const user = await this.usersService.findByEmail(payload.email);

    if (user?.verificationToken !== token) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.usersService.update(user.id, {
      isEmailVerified: true,
      verificationToken: null,
    });

    return { message: 'Email verified successfully' };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user);

    await this.usersService.update(user.id, {
      refreshToken: await bcrypt.hash(tokens.refresh_token, SALT_ROUNDS),
    });
    return tokens;
  }

  async refresh(oldToken: string) {
    const payload = await this.jwtService.verifyAsync<{
      sub: number;
      email: string;
      role: UserRole;
    }>(oldToken, {
      secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_ACCESS_SECRET,
    });
    const user = await this.usersService.findById(payload.sub);

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      oldToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.update(user.id, {
      refreshToken: await bcrypt.hash(tokens.refresh_token, SALT_ROUNDS),
    });

    return tokens;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const resetToken = await this.jwtService.signAsync(
        { sub: user.id, purpose: 'password_reset' },
        {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: process.env.JWT_REFRESH_EXPIRATION as StringValue,
        },
      );
      const resetUrl = `${this.getBaseUrl()}/forgot-password?token=${resetToken}`;
      await this.emailQueue.add(
        JOB_EMAIL_SEND,
        {
          notificationId: `auth-reset:${user.id}`,
          to: user.email,
          subject: 'Reset your password',
          body: `Click to reset your password: ${resetUrl}`,
        },
        { jobId: `auth-reset:${user.id}` },
      );
    }
    return {
      message: 'If that email exists, a password reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = await this.jwtService.verifyAsync<{
      sub: number;
      purpose: string;
    }>(token, { secret: process.env.JWT_ACCESS_SECRET });

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid password reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersService.update(payload.sub, {
      password: hashedPassword,
      refreshToken: null,
    });

    return { message: 'Password updated' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user?.password) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashed = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.usersService.update(userId, {
      password: hashed,
      refreshToken: null,
    });

    return { message: 'Password changed successfully' };
  }

  async sendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message: 'If that email exists, a verification link has been sent',
      };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    const verificationToken = await this.jwtService.signAsync(
      { email: user.email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION as StringValue,
      },
    );

    await this.usersService.update(user.id, { verificationToken });

    const verifyUrl = `${this.getBaseUrl()}/verify-email?token=${verificationToken}`;
    await this.emailQueue.add(
      JOB_EMAIL_SEND,
      {
        notificationId: `auth-verify:${user.id}:${Date.now()}`,
        to: user.email,
        subject: 'Verify your email',
        body: `Click to verify: ${verifyUrl}`,
      },
      { jobId: `auth-verify:${user.id}:${Date.now()}` },
    );

    return {
      message: 'If that email exists, a verification link has been sent',
    };
  }

  async logout(id: number) {
    await this.usersService.update(id, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }
}
