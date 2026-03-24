import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EMAIL_QUEUE, JOB_EMAIL_SEND } from 'src/shared/constants';
import { SendgridEmailService } from '../email/sendgrid-email.service';
import { SmtpEmailService } from '../email/smtp-email.service';

type EmailJobPayload = {
  notificationId: string;
  to: string;
  subject: string;
  body: string;
};

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sendgridEmailService: SendgridEmailService,
    private readonly smtpEmailService: SmtpEmailService,
  ) {
    super();
  }

  async process(job: Job<EmailJobPayload>) {
    if (job.name !== JOB_EMAIL_SEND) {
      return { ignored: true };
    }

    const provider = this.configService.get<string>('email.provider', 'mailtrap');
    if (provider === 'sendgrid') {
      await this.sendgridEmailService.send({
        to: job.data.to,
        subject: job.data.subject,
        body: job.data.body,
      });
    } else if (provider === 'smtp' || provider === 'mailtrap') {
      await this.smtpEmailService.send({
        to: job.data.to,
        subject: job.data.subject,
        body: job.data.body,
      });
    } else {
      throw new Error(
        `Unsupported EMAIL_PROVIDER=${provider}. Supported: mailtrap, smtp, sendgrid`,
      );
    }

    this.logger.log(
      `Email sent via ${provider} to=${job.data.to} notification=${job.data.notificationId}`,
    );
    return { delivered: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Email job failed id=${job.id} name=${job.name}`,
      error.stack,
    );
  }
}
