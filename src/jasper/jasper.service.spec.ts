import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JasperReportService } from './jasper.service.js';

vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    copyFile: vi.fn(),
    mkdir: vi.fn(),
    rm: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('JasperReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fs.access as any).mockResolvedValue(undefined);
    (fs.copyFile as any).mockResolvedValue(undefined);
    (fs.mkdir as any).mockResolvedValue(undefined);
    (fs.rm as any).mockResolvedValue(undefined);
  });

  it('passes fetched investment rows to Jasper as a JSON datasource', async () => {
    const row = {
      id: 'request-1',
      companyName: 'Acme Ltd',
      amount: 1250,
      status: 'PENDING_APPROVAL',
      riskLevel: 'LOW',
      createdAt: new Date('2026-10-05T00:00:00.000Z'),
    };
    const rendered = Buffer.from('%PDF-test');
    const exportMethod = vi.fn().mockResolvedValue(rendered);
    const report = {
      loadParameters: vi.fn().mockResolvedValue(undefined),
      jasperInstance: {
        pdf: exportMethod,
        xlsx: vi.fn(),
        docx: vi.fn(),
        html: vi.fn(),
      },
      hierarchy: { hierarchy: { value: { name: 'investment' } } },
    };
    const templateRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
    };
    const jasperClient = {
      createReport: vi.fn().mockResolvedValue(report),
    };
    const investmentRequestRepo = {
      findOne: vi.fn().mockResolvedValue(row),
    };
    const userApprovalRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    const service = new JasperReportService(
      templateRepo as any,
      jasperClient as any,
      investmentRequestRepo as any,
      userApprovalRepo as any,
    );

    const result = await service.generate({
      templateName: 'investment',
      format: 'pdf',
      params: { investmentRequestId: 'request-1', notificationType: 'Investment' },
    });

    expect(result).toEqual(rendered);
    expect(jasperClient.createReport).toHaveBeenCalledWith({
      conn: 'in_memory_json',
      dirReport: expect.any(String),
    });
    expect(exportMethod).toHaveBeenCalledWith({
      report: 'investment',
      data: {
        investmentRequestId: 'request-1',
        notificationType: 'Investment',
      },
      dataset: {
        data: [
          {
            company_name: 'Acme Ltd',
            amount: 1250,
            status: 'PENDING_APPROVAL',
            risk_level: 'LOW',
            created_at: '05/10/2026',
            approval_decision: '',
            approver_name: '',
            department_name: '',
          },
        ],
      },
      query: 'data',
    });
    expect(fs.access).toHaveBeenCalledWith(expect.stringContaining('investment.jrxml'));
    expect(fs.copyFile).toHaveBeenCalled();
  });
});
