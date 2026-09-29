import { vi } from 'vitest';
import { NotificationsConsumer } from './notification.consumer.js';

describe('NotificationsConsumer', () => {
  const requestReport = vi.fn();
  const sendNotification = vi.fn();
  const sendReportNotification = vi.fn();
  let consumer: NotificationsConsumer;

  beforeEach(() => {
    requestReport.mockReset().mockResolvedValue({
      message: 'Investment report queued for delivery',
    });
    sendNotification.mockReset();
    sendReportNotification.mockReset();
    consumer = new NotificationsConsumer(
      {} as never,
      {} as never,
      { sendNotification, sendReportNotification } as never,
      { requestReport } as never,
    );
  });

  it('queues the approval report for Jasper', async () => {
    await consumer.handleApproval({ investmentRequestId: 'request-1' });

    expect(requestReport).toHaveBeenCalledWith('request-1', 'APPROVAL');
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('queues the rejection report for Jasper', async () => {
    await consumer.handleRejection({ investmentRequestId: 'request-2' });

    expect(requestReport).toHaveBeenCalledWith('request-2', 'REJECTION');
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('emails the rendered Jasper PDF for an approval', async () => {
    const pdfBase64 = Buffer.from('%PDF-1.7 test').toString('base64');
    const requestId = '28cd2bfc-18df-4809-83ac-d7faf55af099';

    await consumer.handleRenderedReport({
      investmentRequestId: requestId,
      recipientEmail: 'investor@example.com',
      notificationType: 'APPROVAL',
      pdfBase64,
    });

    expect(sendReportNotification).toHaveBeenCalledWith(
      'investor@example.com',
      'Investment request approved',
      `Your investment request ${requestId} was approved. The Jasper report is attached.`,
      expect.any(Buffer),
      `investment-${requestId}-approval.pdf`,
    );
  });

  it('emails the rendered Jasper PDF for a rejection', async () => {
    const pdfBase64 = Buffer.from('%PDF-1.7 test').toString('base64');
    const requestId = '28cd2bfc-18df-4809-83ac-d7faf55af099';

    await consumer.handleRenderedReport({
      investmentRequestId: requestId,
      recipientEmail: 'investor@example.com',
      notificationType: 'REJECTION',
      pdfBase64,
    });

    expect(sendReportNotification).toHaveBeenCalledWith(
      'investor@example.com',
      'Investment request rejected',
      `Your investment request ${requestId} was rejected. The Jasper report is attached.`,
      expect.any(Buffer),
      `investment-${requestId}-rejection.pdf`,
    );
  });
});