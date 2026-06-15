import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post('webhooks/stripe')
  stripeWebhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    if (!request.rawBody) {
      throw new BadRequestException('Missing raw body for Stripe webhook');
    }
    return this.paymentsService.handleStripeWebhook(request.rawBody, signature);
  }

  @Post('webhooks/chapa')
  chapaWebhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('x-chapa-signature') xSignature?: string,
    @Headers('chapa-signature') signature?: string,
  ) {
    const activeSignature = xSignature || signature;
    if (!activeSignature) {
      throw new BadRequestException('Missing Chapa signature header');
    }
    if (!request.rawBody) {
      throw new BadRequestException('Missing raw body for Chapa webhook');
    }
    return this.paymentsService.handleChapaWebhook(request.rawBody, activeSignature);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
