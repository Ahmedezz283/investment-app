import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JasperTemplate } from './jasper-template.entity.js';
import { JasperRenderPayload } from './jasper-render-payload.entity.js';
import { RenderTemplateDto } from './dto/render-template.dto.js';

interface JrxmlUpload {
  buffer: Buffer;
  originalname: string;
}

@Injectable()
export class JasperTemplatesService {
  constructor(
    @InjectRepository(JasperTemplate)
    private readonly templatesRepository: Repository<JasperTemplate>,
    @InjectRepository(JasperRenderPayload)
    private readonly renderPayloadRepository: Repository<JasperRenderPayload>,
    private readonly configService: ConfigService,
  ) {}

  async upload(name: string, file?: JrxmlUpload) {
    const templateName = name?.trim();
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('A JRXML file is required');
    }
    if (!file.originalname.toLowerCase().endsWith('.jrxml')) {
      throw new BadRequestException('Template file must have a .jrxml extension');
    }

    if (await this.templatesRepository.findOne({ where: { name: templateName } })) {
      throw new ConflictException(`Jasper template ${templateName} already exists`);
    }

    const template = await this.templatesRepository.save(
      this.templatesRepository.create({
        name: templateName,
        fileName: file.originalname,
        content: file.buffer,
      }),
    );
    return this.toMetadata(template);
  }

  async replace(name: string, file?: JrxmlUpload) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('A JRXML file is required');
    }
    if (!file.originalname.toLowerCase().endsWith('.jrxml')) {
      throw new BadRequestException('Template file must have a .jrxml extension');
    }

    const template = await this.findOne(name);
    template.fileName = file.originalname;
    template.content = file.buffer;
    const updated = await this.templatesRepository.save(template);
    return this.toMetadata(updated);
  }

  async findAll() {
    const templates = await this.templatesRepository.find({
      select: { id: true, name: true, fileName: true, createdAt: true },
      order: { name: 'ASC' },
    });
    return templates.map((template) => this.toMetadata(template));
  }

  async findOne(name: string): Promise<JasperTemplate> {
    const template = await this.templatesRepository.findOne({ where: { name } });
    if (!template) {
      throw new NotFoundException(`Jasper template ${name} not found`);
    }
    return template;
  }

  async render(name: string, data: RenderTemplateDto): Promise<Buffer> {
    const template = await this.findOne(name);
    this.assertCompatibleJrxml(template.content);
    const payload = await this.renderPayloadRepository.save(
      this.renderPayloadRepository.create({ rows: data.rows }),
    );
    const reportUri = this.reportUri(name, payload.id);
    const jrxmlUri = `${reportUri}_source`;
    const dataSourceUri = `${reportUri}_datasource`;
    let reportCreated = false;
    let jrxmlCreated = false;
    let dataSourceCreated = false;
    try {
      const jrxml = this.prepareJrxml(template.content, payload.id);
      await this.ensureJasperFolder();
      await this.jasperRequest(`/rest_v2/resources${jrxmlUri}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/jrxml',
          'Content-Disposition': `attachment; filename="${template.fileName.replace(/["\\]/g, '_')}"`,
        },
        body: jrxml,
      });
      jrxmlCreated = true;
      await this.jasperRequest(`/rest_v2/resources${dataSourceUri}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/repository.jdbcDataSource+json' },
        body: JSON.stringify(this.dataSourceDescriptor(name)),
      });
      dataSourceCreated = true;
      await this.jasperRequest(`/rest_v2/resources${reportUri}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/repository.reportUnit+json' },
        body: JSON.stringify(this.reportUnitDescriptor(name, jrxmlUri, dataSourceUri)),
      });
      reportCreated = true;

      const parameters = new URLSearchParams({
        renderId: payload.id,
        investmentRequestId: data.investmentRequestId,
        notificationType: data.notificationType,
      });
      const reportResponse = await this.jasperRequest(
        `/rest_v2/reports${reportUri}.pdf?${parameters.toString()}`,
        { headers: { Accept: 'application/pdf' } },
      );
      if (!reportResponse) {
        throw new BadGatewayException('Jasper Server did not return a report response');
      }
      const pdf = Buffer.from(await reportResponse.arrayBuffer());
      if (pdf.subarray(0, 5).toString() !== '%PDF-') {
        throw new BadGatewayException('Jasper Server returned an invalid PDF');
      }
      return pdf;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadGatewayException('Jasper Server could not provision or render this template');
    } finally {
      if (reportCreated) {
        await this.jasperRequest(`/rest_v2/resources${reportUri}`, { method: 'DELETE' }).catch(() => undefined);
      }
      if (dataSourceCreated) {
        await this.jasperRequest(`/rest_v2/resources${dataSourceUri}`, { method: 'DELETE' }).catch(() => undefined);
      }
      if (jrxmlCreated) {
        await this.jasperRequest(`/rest_v2/resources${jrxmlUri}`, { method: 'DELETE' }).catch(() => undefined);
      }
      await this.renderPayloadRepository.delete(payload.id);
    }
  }

  private async ensureJasperFolder(): Promise<void> {
    const folderUri = this.reportsFolder();
    const url = `/rest_v2/resources${folderUri}`;
    const existing = await this.jasperRequest(url, {}, true);
    if (existing) return;

    const folderName = folderUri.split('/').filter(Boolean).at(-1);
    if (!folderName) {
      throw new BadRequestException('JASPER_REPORTS_FOLDER must not be the repository root');
    }
    const parent = folderUri.slice(0, folderUri.lastIndexOf('/')) || '';
    await this.jasperRequest(`/rest_v2/resources${parent}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/repository.folder+json' },
      body: JSON.stringify({ label: folderName, description: 'Investment report templates' }),
    });
  }

  private databaseConnection() {
    const database = this.configService.get<string>('DB_DATABASE')
      ?? this.configService.get<string>('DB_NAME', 'investment_db');
    const host = this.configService.get<string>('JASPER_DB_HOST', 'postgres');
    const port = this.configService.get<string>('JASPER_DB_PORT', '5432');
    const connectionUrl = this.configService.get<string>(
      'JASPER_DB_URL',
      `jdbc:postgresql://${host}:${port}/${database}`,
    );

    return {
      driverClass: 'org.postgresql.Driver',
      connectionUrl,
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'ahmadezz@2005'),
    };
  }

  private dataSourceDescriptor(name: string) {
    return {
      label: `${name} render datasource`,
      description: 'Temporary datasource generated for a manual render request',
      ...this.databaseConnection(),
    };
  }

  private reportUnitDescriptor(name: string, jrxmlUri: string, dataSourceUri: string) {
    return {
      label: `${name} render`,
      description: 'Temporary report unit generated for a manual render request',
      dataSource: { dataSourceReference: { uri: dataSourceUri } },
      jrxml: { jrxmlFileReference: { uri: jrxmlUri } },
    };
  }

  private prepareJrxml(content: Buffer, renderId: string): string {
    const source = content.toString('utf8');
    const fields: Array<{ name: string; className: string }> = [];
    for (const match of source.matchAll(/<field\b([^>]*)\/?\s*>/g)) {
      const name = match[1].match(/\bname="([^"]+)"/)?.[1];
      const className = match[1].match(/\bclass="([^"]+)"/)?.[1] ?? 'java.lang.String';
      if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new BadRequestException('JRXML contains an invalid field name');
      }
      fields.push({ name, className });
    }
    if (fields.length === 0) {
      throw new BadRequestException('JRXML must declare at least one field for row data');
    }

    const projections = fields.map(({ name, className }) => {
      const jsonValue = `row_item.data ->> '${name}'`;
      const sqlType = this.sqlType(className);
      return `${sqlType ? `(${jsonValue})::${sqlType}` : jsonValue} AS "${name}"`;
    });
    const query = [
      'SELECT',
      projections.join(',\n'),
      'FROM jasper_render_payloads AS payload',
      'CROSS JOIN LATERAL jsonb_array_elements(payload.rows) AS row_item(data)',
      'WHERE payload.id = CAST($P{renderId} AS UUID)',
    ].join('\n');
    const queryElement = `<queryString language="SQL"><![CDATA[${query}]]></queryString>`;
    let result = source.replace(/<queryString\b[^>]*>[\s\S]*?<\/queryString>/, queryElement);
    if (result === source) {
      const fieldStart = result.search(/<field\b/);
      if (fieldStart < 0) {
        throw new BadRequestException('JRXML field declarations could not be located');
      }
      result = `${result.slice(0, fieldStart)}${queryElement}${result.slice(fieldStart)}`;
    }
    if (!/\bname="renderId"/.test(result)) {
      const queryStart = result.indexOf('<queryString');
      result = `${result.slice(0, queryStart)}<parameter name="renderId" class="java.lang.String"/>${result.slice(queryStart)}`;
    }
    return result;
  }

  private assertCompatibleJrxml(content: Buffer): void {
    const source = content.toString('utf8');
    if (/<jasperReport\b[^>]*\buuid=/.test(source) || /<element\b[^>]*\bkind=/.test(source)) {
      throw new BadRequestException(
        'This template uses JRXML 7 syntax that JasperReports Server 7.8 cannot read. Re-export it using a JasperReports version compatible with Server 7.8.',
      );
    }
  }

  private sqlType(className: string): string | undefined {
    const types: Record<string, string> = {
      'java.math.BigDecimal': 'numeric',
      'java.lang.Integer': 'integer',
      'java.lang.Long': 'bigint',
      'java.lang.Double': 'double precision',
      'java.lang.Float': 'real',
      'java.lang.Boolean': 'boolean',
      'java.util.Date': 'timestamp',
      'java.sql.Date': 'date',
      'java.sql.Timestamp': 'timestamp',
    };
    const supported = new Set([
      'java.lang.String',
      'java.math.BigDecimal',
      'java.lang.Integer',
      'java.lang.Long',
      'java.lang.Double',
      'java.lang.Float',
      'java.lang.Boolean',
      'java.util.Date',
      'java.sql.Date',
      'java.sql.Timestamp',
    ]);
    if (!supported.has(className)) {
      throw new BadRequestException(`JRXML field type ${className} is not supported`);
    }
    return types[className];
  }

  private reportsFolder(): string {
    const configured = this.configService.get<string>('JASPER_REPORTS_FOLDER', '/reports');
    if (!configured.startsWith('/') || configured.includes('..')) {
      throw new BadRequestException('JASPER_REPORTS_FOLDER must be an absolute repository path');
    }
    return configured.replace(/\/+$/, '');
  }

  private reportUri(name: string, requestId: string): string {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(name)) {
      throw new BadRequestException('Invalid Jasper template name');
    }
    return `${this.reportsFolder()}/${name}_${requestId.replace(/[^A-Za-z0-9_-]/g, '')}`;
  }

  private async jasperRequest(
    path: string,
    init: RequestInit = {},
    allowNotFound = false,
  ): Promise<globalThis.Response | undefined> {
    const baseUrl = this.configService.get<string>(
      'JASPER_URL',
      'http://localhost:8083/jasperserver',
    ).replace(/\/+$/, '');
    const username = this.configService.get<string>('JASPER_USER', 'jasperadmin');
    const password = this.configService.get<string>('JASPER_PASSWORD', 'jasperadmin');
    const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    let response: globalThis.Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: { Authorization: authorization, Accept: 'application/json', ...init.headers },
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      throw new ServiceUnavailableException('JasperReports Server is unavailable');
    }
    if (allowNotFound && response.status === 404) return undefined;
    if (!response.ok) {
      const details = (await response.text()).slice(0, 400);
      throw new BadGatewayException(`Jasper Server returned ${response.status}${details ? `: ${details}` : ''}`);
    }
    return response;
  }

  private toMetadata(template: JasperTemplate) {
    return {
      id: template.id,
      name: template.name,
      fileName: template.fileName,
      createdAt: template.createdAt,
    };
  }
}