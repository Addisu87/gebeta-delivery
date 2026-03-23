import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

@Injectable()
export class SendgridEmailService {
  constructor(private readonly configService: ConfigService) {}

  async send(input: SendEmailInput) {
    const apiKey = this.configService.get<string>('email.sendgridApiKey');
    const fromEmail = this.configService.get<string>('email.fromEmail');

    if (!apiKey) {
      throw new BadRequestException('SENDGRID_API_KEY is not configured');
    }
    if (!fromEmail) {
      throw new BadRequestException('EMAIL_FROM is not configured');
    }

    const payload = {
      personalizations: [{ to: [{ email: input.to }] }],
      from: { email: fromEmail },
      subject: input.subject,
      content: [{ type: 'text/plain', value: input.body }],
    };

    await axios.post('https://api.sendgrid.com/v3/mail/send', payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }
}
