import { Logger } from '@nestjs/common';
import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EMAIL_QUEUE, NOTIFICATIONS_QUEUE } from '../queue.constants';

type NotificationJobPayload = {
  notificationId: string;
  title: string;
  message: string;
  recipientEmail?: string;
};

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<NotificationJobPayload>) {
    if (job.name !== 'notification.created') {
      return { ignored: true };
    }

    this.logger.log(`Processing notification.created id=${job.data.notificationId}`);

    if (job.data.recipientEmail) {
      await this.emailQueue.add(
        'email.send',
        {
          notificationId: job.data.notificationId,
          to: job.data.recipientEmail,
          subject: job.data.title,
          body: job.data.message,
        },
        { jobId: `email-send:${job.data.notificationId}` },
      );
    }

    return { processed: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Notification job failed id=${job.id} name=${job.name}`,
      error.stack,
    );
  }
}
