import { Controller, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { User } from '../user/user-entity.js';
import { KeycloakAdminService } from '../keycloak/keycloak-admin-service.js';
import { MailService } from './mail.service.js';

interface NotificationEvent {
  investmentRequestId: string;
  investorId?: string;
}

@Controller()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly mailService: MailService,
  ) {}

  @EventPattern('investment.notification.missing-data')
  handleMissingData(@Payload() data: NotificationEvent) {
    return this.sendEmailSafely(data, 'Additional information is required',
      `Additional information is required for investment request ${data.investmentRequestId}.`);
  }

  @EventPattern('investment.notification.rejection')
  handleRejection(@Payload() data: NotificationEvent) {
    return this.sendEmailSafely(data, 'Investment request rejected',
      `Your investment request ${data.investmentRequestId} was rejected.`);
  }

  @EventPattern('investment.notification.approval')
  handleApproval(@Payload() data: NotificationEvent) {
    return this.sendEmailSafely(data, 'Investment request approved',
      `Your investment request ${data.investmentRequestId} was approved.`);
  }

  private async sendEmailSafely(
    data: NotificationEvent,
    subject: string,
    text: string,
  ): Promise<void> {
    try {
      await this.sendEmail(data, subject, text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Notification delivery failed for request ${data.investmentRequestId}: ${message}`,
      );
    }
  }

  private async sendEmail(
    data: NotificationEvent,
    subject: string,
    text: string,
  ): Promise<void> {
    const investorId = data.investorId;
    if (!investorId || !this.isUuid(investorId)) {
      this.logger.error(
        `Ignoring notification for request ${data.investmentRequestId}: invalid investorId`,
      );
      return;
    }

    const user = await this.userRepository.findOne({ where: { id: investorId } });
    if (!user) {
      this.logger.error(`Investor ${investorId} not found; notification skipped`);
      return;
    }

    const keycloakUser = await this.keycloakAdminService.getUser(user.keycloakId);
    if (!keycloakUser?.email) {
      this.logger.error(`Email for investor ${investorId} not found; notification skipped`);
      return;
    }

    await this.mailService.sendNotification(keycloakUser.email, subject, text);
    this.logger.log(`Sent ${subject} email for request ${data.investmentRequestId}`);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}