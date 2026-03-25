import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EMAIL_QUEUE, JOB_EMAIL_SEND } from 'src/shared/constants';
import { MailtrapEmailService } from '../email/mailtrap-email.service';

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
    private readonly mailtrapEmailService: MailtrapEmailService,
  ) {
    super();
  }

  async process(job: Job<EmailJobPayload>) {
    if (job.name !== JOB_EMAIL_SEND) {
      return { ignored: true };
    }

    await this.mailtrapEmailService.send({
      to: job.data.to,
      subject: job.data.subject,
      body: job.data.body,
      category: job.data.notificationId,
    });

    this.logger.log(
      `Email sent via mailtrap to=${job.data.to} notification=${job.data.notificationId}`,
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
