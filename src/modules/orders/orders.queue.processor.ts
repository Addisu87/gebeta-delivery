import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ORDERS_QUEUE } from '../queue/queue.constants';

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
    if (job.name === 'order.created') {
      this.logger.log(`Processing order.created for orderId=${job.data.orderId}`);
      return { processed: true };
    }
    return { ignored: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Order job failed id=${job.id} name=${job.name}`, error.stack);
  }
}
