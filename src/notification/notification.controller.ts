import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { NotificationsService } from './notification.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('missing-data')
  notifyMissingData(@Body() body: { investmentRequestId: string; investorId?: string }) {
    this.validateBody(body);
    this.notificationsService.publishMissingData(body.investmentRequestId, body.investorId);
    return { published: true };
  }

  @Post('rejection')
  notifyRejection(@Body() body: { investmentRequestId: string; investorId?: string }) {
    this.validateBody(body);
    this.notificationsService.publishRejection(body.investmentRequestId, body.investorId);
    return { published: true };
  }

  @Post('approval')
  notifyApproval(@Body() body: { investmentRequestId: string; investorId?: string }) {
    this.validateBody(body);
    this.notificationsService.publishApproval(body.investmentRequestId, body.investorId);
    return { published: true };
  }

  private validateBody(body: { investmentRequestId: string; investorId?: string }): void {
    if (!body.investmentRequestId || !body.investorId || !isUUID(body.investorId)) {
      throw new BadRequestException(
        'investmentRequestId and a valid investorId UUID are required',
      );
    }
  }
}