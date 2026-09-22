import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NOTIFICATIONS_KAFKA_CLIENT } from './../kafka/kafka.module.js';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @Inject(NOTIFICATIONS_KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('investment.notification.missing-data');
    this.kafkaClient.subscribeToResponseOf('investment.notification.rejection');
    this.kafkaClient.subscribeToResponseOf('investment.notification.approval');
    await this.kafkaClient.connect();
  }

  publishMissingData(investmentRequestId: string, investorId?: string) {
    this.kafkaClient.emit('investment.notification.missing-data', { investmentRequestId, investorId });
  }

  publishRejection(investmentRequestId: string, investorId?: string) {
    this.kafkaClient.emit('investment.notification.rejection', { investmentRequestId, investorId });
  }

  publishApproval(investmentRequestId: string, investorId?: string) {
    this.kafkaClient.emit('investment.notification.approval', { investmentRequestId, investorId });
  }
}