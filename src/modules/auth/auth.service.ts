import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import type { StringValue } from 'ms';
import { UserRole } from 'src/shared/enums/role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../users/entities/user.entity';

type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(createAuthDto: RegisterDto) {
    const verificationToken = await this.jwtService.signAsync(
      { email: createAuthDto.email },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret-for-local-dev',
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION ?? '30m') as StringValue,
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

    console.log(`Verify email: /verify-email?token=${verificationToken}`);

    return {
      message: 'Registration successful',
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  private async generateTokens(user: Pick<User, 'id' | 'email' | 'role'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ??
        process.env.JWT_ACCESS_SECRET ??
        's3cr3t',
      expiresIn: (process.env.JWT_REFRESH_EXPIRATION ?? '7d') as StringValue,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async verifyEmail(token: string) {
    const payload = await this.jwtService.verifyAsync<{ email: string }>(
      token,
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 's3cr3t',
      },
    );
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || user.verificationToken !== token) {
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
      refreshToken: await this.passwordService.hashPassword(
        tokens.refresh_token,
      ),
    });

    return tokens;
  }

  async refresh(oldToken: string) {
    const payload = await this.jwtService.verifyAsync<{
      sub: number;
      email: string;
      role: UserRole;
    }>(oldToken, {
      secret:
        process.env.JWT_REFRESH_SECRET ??
        process.env.JWT_ACCESS_SECRET ??
        's3cr3t',
    });
    const user = await this.usersService.findById(payload.sub);

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await this.passwordService.comparePassword(
      oldToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.update(user.id, {
      refreshToken: await this.passwordService.hashPassword(
        tokens.refresh_token,
      ),
    });

    return tokens;
  }

  private async sendResetLink(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret:
          process.env.JWT_RESET_SECRET ??
          process.env.JWT_ACCESS_SECRET ??
          's3cr3t',
        expiresIn: (process.env.JWT_RESET_EXPIRATION ?? '15m') as StringValue,
      },
    );

    console.log(`Reset link: /reset-password?token=${resetToken}`);
  }

  async forgotPassword(email: string) {
    await this.sendResetLink(email);
    return {
      message: 'If that email exists, a password reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = await this.jwtService.verifyAsync<{ sub: number }>(token, {
      secret:
        process.env.JWT_RESET_SECRET ??
        process.env.JWT_ACCESS_SECRET ??
        's3cr3t',
    });

    const hashedPassword = await this.passwordService.hashPassword(newPassword);
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

    const isMatch = await this.passwordService.comparePassword(
      dto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashed = await this.passwordService.hashPassword(dto.newPassword);

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
        secret: process.env.JWT_ACCESS_SECRET ?? 's3cr3t',
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION ?? '30m') as StringValue,
      },
    );

    await this.usersService.update(user.id, { verificationToken });
    console.log(`Verify email: /verify-email?token=${verificationToken}`);

    return {
      message: 'If that email exists, a verification link has been sent',
    };
  }

  async logout(id: number) {
    await this.usersService.update(id, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  private sanitizeUser(user: User) {
    const { password, refreshToken, verificationToken, ...safeUser } = user;
    return safeUser;
  }
}
