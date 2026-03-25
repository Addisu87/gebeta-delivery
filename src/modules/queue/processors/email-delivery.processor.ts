import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EMAIL_QUEUE, JOB_EMAIL_SEND } from 'src/shared/constants';
import { MailtrapEmailService } from '../email/mailtrap-email.service';

// Delivery step: send the email via Mailtrap.
type EmailSendJobPayload = {
  category: string;
  to: string;
  subject: string;
  body: string;
};

@Processor(EMAIL_QUEUE)
export class EmailDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailDeliveryProcessor.name);

  constructor(
    private readonly mailtrapEmailService: MailtrapEmailService,
  ) {
    super();
  }

  async process(job: Job<EmailSendJobPayload>) {
    if (job.name !== JOB_EMAIL_SEND) {
      return { ignored: true };
    }

    await this.mailtrapEmailService.send({
      to: job.data.to,
      subject: job.data.subject,
      body: job.data.body,
      category: job.data.category,
    });

    this.logger.log(`Email delivered via mailtrap to=${job.data.to}`);
    return { delivered: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailSendJobPayload>, error: Error) {
    this.logger.error(
      `Email job failed id=${job.id} name=${job.name}`,
      error.stack,
    );
  }
}
