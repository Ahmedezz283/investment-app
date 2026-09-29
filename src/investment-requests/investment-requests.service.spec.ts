import { of } from 'rxjs';
import { vi } from 'vitest';
import { InvestmentRequestsService } from './investment-requests.service.js';

describe('InvestmentRequestsService', () => {
  let service: InvestmentRequestsService;
  const requestId = '28cd2bfc-18df-4809-83ac-d7faf55af099';
  const rows = [{ company_name: 'Example Ltd', amount: '125000' }];
  const queryBuilder = {
    leftJoin: vi.fn(),
    select: vi.fn(),
    addSelect: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getRawMany: vi.fn(),
  };
  const investmentRequestsRepository = {
    findOne: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const userRepository = { findOne: vi.fn() };
  const keycloakAdminService = { getUser: vi.fn() };
  const kafkaClient = { emit: vi.fn() };
  const jasperTemplatesService = { render: vi.fn() };
  const configService = { get: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    for (const method of Object.values(queryBuilder)) {
      method.mockReturnValue(queryBuilder);
    }
    queryBuilder.getRawMany.mockResolvedValue(rows);
    investmentRequestsRepository.findOne.mockResolvedValue({
      id: requestId,
      investorId: '491f639b-1ceb-4a41-8047-3012b9e28036',
    });
    investmentRequestsRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    userRepository.findOne.mockResolvedValue({ keycloakId: 'keycloak-user-id' });
    keycloakAdminService.getUser.mockResolvedValue({ email: 'investor@example.com' });
    kafkaClient.emit.mockReturnValue(of(undefined));
    jasperTemplatesService.render.mockResolvedValue(Buffer.from('%PDF-1.7 rendered'));
    configService.get.mockReturnValue('investment');

    service = new InvestmentRequestsService(
      investmentRequestsRepository as never,
      {} as never,
      userRepository as never,
      {} as never,
      {} as never,
      keycloakAdminService as never,
      kafkaClient as never,
      jasperTemplatesService as never,
      configService as never,
    );
  });

  it('renders through Jasper and publishes the PDF for Kafka email delivery', async () => {
    await expect(service.requestReport(requestId, 'APPROVAL')).resolves.toEqual({
      message: 'Rendered report queued for email delivery',
    });

    expect(jasperTemplatesService.render).toHaveBeenCalledWith('investment', {
      investmentRequestId: requestId,
      notificationType: 'APPROVAL',
      rows,
    });
    expect(kafkaClient.emit).toHaveBeenCalledWith(
      'investment.report.rendered',
      expect.objectContaining({
        investmentRequestId: requestId,
        recipientEmail: 'investor@example.com',
        notificationType: 'APPROVAL',
        pdfBase64: Buffer.from('%PDF-1.7 rendered').toString('base64'),
      }),
    );
    expect(kafkaClient.emit).not.toHaveBeenCalledWith(
      'investment.report.requested',
      expect.anything(),
    );
  });
});
