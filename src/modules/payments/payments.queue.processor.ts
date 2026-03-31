import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JOB_PAYMENT_CREATED, PAYMENTS_QUEUE } from 'src/shared/constants';

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
    if (job.name === JOB_PAYMENT_CREATED) {
      this.logger.log(
        `Processing ${JOB_PAYMENT_CREATED} for paymentId=${job.data.paymentId}`,
      );
      return await Promise.resolve({ processed: true });
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
