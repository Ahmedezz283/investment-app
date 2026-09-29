import { BadRequestException, ConflictException } from '@nestjs/common';
import { vi } from 'vitest';
import { JasperTemplatesService } from './jasper-templates.service.js';

describe('JasperTemplatesService', () => {
  const templatesRepository = {
    create: vi.fn((template) => template),
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const renderPayloadRepository = {
    create: vi.fn((payload) => payload),
    delete: vi.fn(),
    save: vi.fn(),
  };
  const configService = {
    get: vi.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        JASPER_URL: 'http://jasper-server:8080/jasperserver',
        JASPER_USER: 'jasperadmin',
        JASPER_PASSWORD: 'jasperadmin',
        JASPER_REPORTS_FOLDER: '/reports',
        DB_DATABASE: 'investment_db',
        DB_NAME: 'investment_db',
        DB_USERNAME: 'postgres',
        DB_PASSWORD: 'postgres',
        DB_PORT: '5432',
      };
      return values[key] ?? fallback;
    }),
  };
  let service: JasperTemplatesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JasperTemplatesService(
      templatesRepository as never,
      renderPayloadRepository as never,
      configService as never,
    );
    templatesRepository.save.mockImplementation(async (template) => ({
      ...template,
      id: 'template-id',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }));
    renderPayloadRepository.save.mockImplementation(async (payload) => ({
      ...payload,
      id: 'e1cdd885-f03c-41c1-ae2d-1260793c3f60',
    }));
  });

  it('stores a named JRXML file and returns metadata', async () => {
    templatesRepository.findOne.mockResolvedValue(null);
    const file = {
      originalname: 'investment.jrxml',
      buffer: Buffer.from('<jasperReport name="investment"/>'),
    };

    await expect(service.upload('investment', file)).resolves.toEqual({
      id: 'template-id',
      name: 'investment',
      fileName: 'investment.jrxml',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(templatesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'investment', content: file.buffer }),
    );
  });

  it('rejects files that are not JRXML templates', async () => {
    await expect(
      service.upload('investment', {
        originalname: 'notes.txt',
        buffer: Buffer.from('not a report'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(templatesRepository.save).not.toHaveBeenCalled();
  });

  it('rejects duplicate template names', async () => {
    templatesRepository.findOne.mockResolvedValue({ name: 'investment' });

    await expect(
      service.upload('investment', {
        originalname: 'investment.jrxml',
        buffer: Buffer.from('<jasperReport/>'),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(templatesRepository.save).not.toHaveBeenCalled();
  });

  it('replaces the JRXML bytes for an existing template name', async () => {
    const replacement = Buffer.from('<jasperReport name="investment"/>');
    templatesRepository.findOne.mockResolvedValue({
      id: 'template-id',
      name: 'investment',
      fileName: 'investment.jrxml',
      content: Buffer.from('old template'),
    });

    await expect(
      service.replace('investment', {
        originalname: 'investment-compatible.jrxml',
        buffer: replacement,
      }),
    ).resolves.toEqual({
      id: 'template-id',
      name: 'investment',
      fileName: 'investment-compatible.jrxml',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(templatesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'investment',
        fileName: 'investment-compatible.jrxml',
        content: replacement,
      }),
    );
  });

  it('rejects JRXML 7 syntax that is incompatible with Jasper Server 7.8', async () => {
    templatesRepository.findOne.mockResolvedValue({
      name: 'investment',
      fileName: 'investment.jrxml',
      content: Buffer.from(
        '<jasperReport uuid="template-id"><element kind="staticText"/></jasperReport>',
      ),
    });

    await expect(
      service.render('investment', {
        investmentRequestId: 'request-1',
        notificationType: 'APPROVAL',
        rows: [{ company_name: 'Example Ltd' }],
      }),
    ).rejects.toThrow(/JRXML 7 syntax.*Server 7\.8/);
    expect(renderPayloadRepository.save).not.toHaveBeenCalled();
  });

  it('stages rows, provisions a Jasper report unit, and returns the PDF', async () => {
    const content = Buffer.from(
      '<jasperReport><field name="company_name" class="java.lang.String"/></jasperReport>',
    );
    templatesRepository.findOne.mockResolvedValue({
      name: 'investment',
      fileName: 'investment.jrxml',
      content,
    });
    const pdf = Buffer.from('%PDF-1.7 rendered');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
      .mockResolvedValueOnce(new Response(pdf, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      service.render('investment', {
        investmentRequestId: 'request-1',
        notificationType: 'APPROVAL',
        rows: [{ company_name: 'Example Ltd', amount: 125000 }],
      }),
    ).resolves.toEqual(pdf);

    expect(renderPayloadRepository.save).toHaveBeenCalledWith({
      rows: [{ company_name: 'Example Ltd', amount: 125000 }],
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://jasper-server:8080/jasperserver/rest_v2/resources/reports',
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      'http://jasper-server:8080/jasperserver/rest_v2/resources',
    );
    expect(fetchMock.mock.calls[2][0]).toBe(
      'http://jasper-server:8080/jasperserver/rest_v2/resources/reports/investment_e1cdd885-f03c-41c1-ae2d-1260793c3f60_source',
    );
    expect(fetchMock.mock.calls[2][1].headers['Content-Type']).toBe('application/jrxml');
    expect(fetchMock.mock.calls[3][0]).toBe(
      'http://jasper-server:8080/jasperserver/rest_v2/resources/reports/investment_e1cdd885-f03c-41c1-ae2d-1260793c3f60_datasource',
    );
    expect(fetchMock.mock.calls[3][1].headers['Content-Type']).toBe(
      'application/repository.jdbcDataSource+json',
    );
    expect(fetchMock.mock.calls[4][0]).toBe(
      'http://jasper-server:8080/jasperserver/rest_v2/resources/reports/investment_e1cdd885-f03c-41c1-ae2d-1260793c3f60',
    );
    const descriptor = JSON.parse(fetchMock.mock.calls[4][1].body);
    expect(descriptor.jrxml.jrxmlFileReference.uri).toContain('_source');
    expect(descriptor.dataSource.dataSourceReference.uri).toContain('_datasource');
    expect(fetchMock.mock.calls[2][1].body).toContain('jsonb_array_elements(payload.rows)');
    expect(fetchMock.mock.calls[5][0]).toContain('/rest_v2/reports/reports/investment_');
    expect(fetchMock.mock.calls[6][0]).toContain('/rest_v2/resources/reports/investment_');
    expect(fetchMock.mock.calls[7][0]).toContain('/rest_v2/resources/reports/investment_');
    expect(fetchMock.mock.calls[8][0]).toContain('/rest_v2/resources/reports/investment_');
    expect(renderPayloadRepository.delete).toHaveBeenCalledWith(
      'e1cdd885-f03c-41c1-ae2d-1260793c3f60',
    );
    vi.unstubAllGlobals();
  });
});