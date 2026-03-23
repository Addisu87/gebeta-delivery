import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PAYMENTS_QUEUE } from '../queue/queue.constants';

type PaymentJobPayload = {
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  method: string;
};

@Processor(PAYMENTS_QUEUE)
export class PaymentsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentsQueueProcessor.name);

  async process(job: Job<PaymentJobPayload>) {
    if (job.name === 'payment.created') {
      this.logger.log(
        `Processing payment.created for paymentId=${job.data.paymentId}`,
      );
      return { processed: true };
    }
    return { ignored: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Payment job failed id=${job.id} name=${job.name}`,
      error.stack,
    );
  }
}
