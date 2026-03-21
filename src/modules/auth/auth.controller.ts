import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth-register.dto';
import { LoginDto } from './dto/auth-login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ResetPasswordDto } from './dto/auth-reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() createAuthDto: RegisterDto) {
    return this.authService.register(createAuthDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.sendResetLink(email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Post('signout')
  signOut(
    @Request()
    req: {
      user: { sub: number; email?: string };
    },
  ) {
    return this.authService.logout(req.user.sub);
  }
}
