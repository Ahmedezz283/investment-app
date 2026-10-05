import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NOTIFICATIONS_KAFKA_CLIENT } from './../kafka/kafka.module.js';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    @Inject(NOTIFICATIONS_KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    return this.kafkaClient
      .connect()
      .catch((error) => this.logger.error('Kafka client connect failed', error));
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