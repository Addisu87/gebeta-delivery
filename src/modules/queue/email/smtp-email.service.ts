import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

@Injectable()
export class SmtpEmailService {
  constructor(private readonly configService: ConfigService) {}

  async send(input: SendEmailInput) {
    const host = this.configService.get<string>('email.smtpHost');
    const port = this.configService.get<number>('email.smtpPort', 587);
    const user = this.configService.get<string>('email.smtpUser');
    const pass = this.configService.get<string>('email.smtpPassword');
    const fromEmail = this.configService.get<string>('email.fromEmail');
    const secure = this.configService.get<boolean>('email.smtpSecure', false);

    if (!host) {
      throw new BadRequestException('SMTP_HOST is not configured');
    }
    if (!fromEmail) {
      throw new BadRequestException('SMTP_FROM or EMAIL_FROM is not configured');
    }
    if (!user || !pass) {
      throw new BadRequestException(
        'SMTP_USER and SMTP_PASSWORD must be configured',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
  }
}
