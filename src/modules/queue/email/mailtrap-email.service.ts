import { BadRequestException, Injectable } from '@nestjs/common';
import { MailtrapClient } from 'mailtrap';

type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
  category?: string;
};

@Injectable()
export class MailtrapEmailService {
  async send(input: SendEmailInput) {
    const token = process.env.MAILTRAP_TOKEN;
    const fromEmail = process.env.MAILTRAP_FROM_EMAIL;
    const fromName = process.env.MAILTRAP_FROM_NAME;

    if (!token) {
      throw new BadRequestException('MAILTRAP_TOKEN is not configured');
    }
    if (!fromEmail) {
      throw new BadRequestException('MAILTRAP_FROM_EMAIL is not configured');
    }
    if (!fromName) {
      throw new BadRequestException('MAILTRAP_FROM_NAME is not configured');
    }

    const client = new MailtrapClient({ token });
    await client.send({
      from: { email: fromEmail, name: fromName },
      to: [{ email: input.to }],
      subject: input.subject,
      text: input.body,
      category: input.category ?? 'Integration Test',
    });
  }
}

