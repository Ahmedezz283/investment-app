import { promises as fs } from 'fs';
import { vi } from 'vitest';
import { JasperService } from './jasper.service.js';

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('JasperService', () => {
  it('passes fetched investment rows to Jasper as a JSON datasource', async () => {
    const row = {
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
        xlsx: exportMethod,
        docx: exportMethod,
        html: exportMethod,
      },
      hierarchy: { hierarchy: { value: { name: 'investment' } } },
    };
    const templateRepo = {
      findOne: vi.fn().mockResolvedValue({ content: Buffer.from('<jrxml/>') }),
    };
    const jasperService = {
      createReport: vi.fn().mockResolvedValue(report),
    };
    const investmentRequestRepo = {
      findOne: vi.fn().mockResolvedValue(row),
    };
    const service = new JasperService(
      templateRepo as any,
      jasperService as any,
      investmentRequestRepo as any,
    );

    const result = await service.generate({
      templateName: 'investment',
      format: 'pdf',
      params: { investmentRequestId: 'request-1' },
    });

    expect(result).toEqual(rendered);
    expect(jasperService.createReport).toHaveBeenCalledWith({
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
    expect(fs.writeFile).toHaveBeenCalled();
  });
});
