import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth-register.dto';
import { PasswordService } from './password.service';
import type { StringValue } from 'ms';
import { UserRole } from 'src/shared/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(createAuthDto: RegisterDto) {
    const user = await this.usersService.create({
      firstName: createAuthDto.firstName,
      lastName: createAuthDto.lastName,
      email: createAuthDto.email,
      password: createAuthDto.password,
      role: createAuthDto.role ?? UserRole.USER,
      isEmailVerified: false,
    });
    const verifyToken = await this.jwtService.signAsync({ sub: user.id });
    console.log(`Verify email: /verify-email?token=${verifyToken}`);
    return user;
  }

  async verifyEmail(token: string) {
    interface JwtEmailVerificationPayload {
      sub: number;
    }
    const payload =
      await this.jwtService.verifyAsync<JwtEmailVerificationPayload>(token);

    await this.usersService.update(payload.sub, {
      isEmailVerified: true,
    });

    return { message: 'Email verified successfully' };
  }

  async login(
    email: string,
    pass: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findByEmail(email);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRATION ?? '15m') as StringValue,
    });

    await this.usersService.update(user.id, { refreshToken });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async sendResetLink(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;
    const resetToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: (process.env.JWT_RESET_EXPIRATION ?? '15m') as StringValue },
    );

    // send email
    console.log(`Reset link: /reset-password?token=${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string) {
    interface JwtResetPasswordPayload {
      sub: number;
    }
    const payload =
      await this.jwtService.verifyAsync<JwtResetPasswordPayload>(token);

    const hashedPassword = await this.passwordService.hashPassword(newPassword);
    await this.usersService.update(payload.sub, { password: hashedPassword });
    return { message: 'Password updated' };
  }

  async logout(id: number) {
    await this.usersService.update(id, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }
}
