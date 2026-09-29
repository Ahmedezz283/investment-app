import { Controller, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventPattern, Payload } from '@nestjs/microservices';
import { isEmail } from 'class-validator';
import { Repository } from 'typeorm';
import { User } from '../user/user-entity.js';
import { KeycloakAdminService } from '../keycloak/keycloak-admin-service.js';
import { InvestmentRequestsService } from '../investment-requests/investment-requests.service.js';
import { MailService } from './mail.service.js';

interface NotificationEvent {
  investmentRequestId: string;
  investorId?: string;
}

interface RenderedReportEvent {
  investmentRequestId: string;
  recipientEmail: string;
  notificationType: 'APPROVAL' | 'REJECTION' | 'REPORT';
  pdfBase64: string;
}

@Controller()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly mailService: MailService,
    private readonly investmentRequestsService: InvestmentRequestsService,
  ) {}

  @EventPattern('investment.notification.missing-data')
  handleMissingData(@Payload() data: NotificationEvent) {
    return this.sendEmailSafely(data, 'Additional information is required',
      `Additional information is required for investment request ${data.investmentRequestId}.`);
  }

  @EventPattern('investment.notification.rejection')
  handleRejection(@Payload() data: NotificationEvent) {
    return this.sendReportSafely(data, 'REJECTION');
  }

  @EventPattern('investment.notification.approval')
  handleApproval(@Payload() data: NotificationEvent) {
    return this.sendReportSafely(data, 'APPROVAL');
  }

  @EventPattern('investment.report.rendered')
  handleRenderedReport(@Payload() data: RenderedReportEvent) {
    return this.sendRenderedReport(data);
  }

  private async sendRenderedReport(data: RenderedReportEvent): Promise<void> {
    try {
      if (
        !data ||
        !this.isUuid(data.investmentRequestId) ||
        !isEmail(data.recipientEmail) ||
        !['APPROVAL', 'REJECTION', 'REPORT'].includes(data.notificationType) ||
        typeof data.pdfBase64 !== 'string'
      ) {
        throw new Error('Invalid Jasper rendered-report event');
      }

      const pdf = Buffer.from(data.pdfBase64, 'base64');
      if (pdf.subarray(0, 5).toString() !== '%PDF-') {
        throw new Error('Jasper report payload is not a valid PDF');
      }

      const decision = data.notificationType === 'APPROVAL'
        ? 'approved'
        : data.notificationType === 'REJECTION'
          ? 'rejected'
          : 'available';
      await this.mailService.sendReportNotification(
        data.recipientEmail,
        data.notificationType === 'REPORT'
          ? 'Investment request report'
          : `Investment request ${decision}`,
        data.notificationType === 'REPORT'
          ? `The report for investment request ${data.investmentRequestId} is attached.`
          : `Your investment request ${data.investmentRequestId} was ${decision}. The Jasper report is attached.`,
        pdf,
        `investment-${data.investmentRequestId}-${data.notificationType.toLowerCase()}.pdf`,
      );
      this.logger.log(
        `Sent ${data.notificationType.toLowerCase()} report email for request ${data.investmentRequestId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to email Jasper report: ${message}`);
      throw error;
    }
  }

  private async sendReportSafely(
    data: NotificationEvent,
    notificationType: 'APPROVAL' | 'REJECTION',
  ): Promise<void> {
    try {
      await this.investmentRequestsService.requestReport(
        data.investmentRequestId,
        notificationType,
      );
      this.logger.log(
        `Queued ${notificationType.toLowerCase()} report for request ${data.investmentRequestId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Report delivery failed for request ${data.investmentRequestId}: ${message}`,
      );
    }
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