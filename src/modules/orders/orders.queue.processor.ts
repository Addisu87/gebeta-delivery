import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JOB_ORDER_CREATED, ORDERS_QUEUE } from 'src/shared/constants';

type OrderJobPayload = {
  orderId: string;
  userId: number;
  restaurantId: string;
  totalAmount: number;
};

@Processor(ORDERS_QUEUE)
export class OrdersQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersQueueProcessor.name);

  async process(job: Job<OrderJobPayload>) {
    if (job.name === JOB_ORDER_CREATED) {
      this.logger.log(`Processing ${JOB_ORDER_CREATED} for orderId=${job.data.orderId}`);
      return { processed: true };
    }
    return { ignored: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Order job failed id=${job.id} name=${job.name}`, error.stack);
  }
}
