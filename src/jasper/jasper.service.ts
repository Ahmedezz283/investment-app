import {
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
    HttpException,
    HttpStatus,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { JasperService } from 'node-jasper-ts/nest';
import { JasperTemplate } from './jasper-template.entity.js';
import { CreateJasperTemplateDto } from './dto/create-template.dto.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import type { MulterFile } from './types/multer-file.type.js';
import { InvestmentRequest } from '../investment-requests/investment-requests.entity.js';
import { UserApproval } from '../user_approval/user_approval.entity.js';

type ReportFormat = GenerateReportDto['format'];

type InvestmentReportRow = {
    company_name: string;
    amount: number;
    status: string;
    risk_level: string;
    created_at: string;
    approval_decision: string;
    approver_name: string;
    department_name: string;
};

type JasperExportOptions = {
    report: string;
    data: Record<string, unknown>;
    dataset: { data: InvestmentReportRow[] };
    query: string;
};

type JasperReportHandle = {
    jasperInstance: Record<ReportFormat, (options: JasperExportOptions) => Promise<unknown>>;
    hierarchy: { hierarchy: { value: { name: string } } };
};

@Injectable()
export class JasperReportService implements OnModuleInit {
    private readonly logger = new Logger(JasperReportService.name);
    private readonly reportsDir = path.join(process.cwd(), 'reports');

    constructor(
        @InjectRepository(JasperTemplate)
        private readonly templateRepo: Repository<JasperTemplate>,
        private readonly jasperService: JasperService,
        @InjectRepository(InvestmentRequest)
        private readonly investmentRequestRepo: Repository<InvestmentRequest>,
        @InjectRepository(UserApproval)
        private readonly userApprovalRepo: Repository<UserApproval>
    ) { }

    async onModuleInit() {
        await fs.mkdir(this.reportsDir, { recursive: true });
        await fs.mkdir(path.join(process.cwd(), 'temp'), { recursive: true });
    }


    async uploadTemplate(dto: CreateJasperTemplateDto, file: MulterFile) {
        const fileName = `${dto.name}.jrxml`;
        const diskPath = path.join(this.reportsDir, fileName);
        await fs.writeFile(diskPath, file.buffer);

        let entity = await this.templateRepo.findOne({ where: { name: dto.name } });
        if (entity) {
            entity.content = file.buffer;
            entity.fileName = fileName;
        } else {
            entity = this.templateRepo.create({
                name: dto.name,
                fileName,
                content: file.buffer,
            });
        }
        await this.templateRepo.save(entity);
        return { id: entity.id, name: entity.name, fileName };
    }

    async listTemplates() {
        return this.templateRepo.find({
            select: {
                id: true,
                name: true,
                fileName: true,
                createdAt: true,
            },
            order: { createdAt: 'DESC' },
        });
    }

    private async ensureTemplateOnDisk(name: string): Promise<string> {
        const fileName = `${name}.jrxml`;
        const diskPath = path.join(this.reportsDir, fileName);

        const entity = await this.templateRepo.findOne({ where: { name } });
        if (!entity) throw new NotFoundException(`Template "${name}" not found`);

        await fs.writeFile(diskPath, entity.content);
        return this.reportsDir;
    }

    async generate(dto: GenerateReportDto): Promise<Buffer> {
        const id = dto.params?.investmentRequestId;
        if (!id) {
            throw new BadRequestException('investmentRequestId is required');
        }

        const rows = await this.loadReportRows(id);
        if (!rows.length) {
            throw new NotFoundException(`No data for request ${id}`);
        }

        const dirReport = await this.ensureTemplateOnDisk(dto.templateName);

        const report = await this.jasperService.createReport({
            conn: 'in_memory_json',
            dirReport,
        });

        const parameters = {
            investmentRequestId: id,
            notificationType: dto.params?.notificationType ?? 'Investment',
        };
        await report.loadParameters(parameters);

        const jasperReport = report as unknown as JasperReportHandle;
        const exportOptions: JasperExportOptions = {
            report: jasperReport.hierarchy.hierarchy.value.name,
            data: parameters,
            dataset: { data: rows },
            query: 'data',
        };

        let binary: unknown;

        switch (dto.format) {
            case 'pdf':
                binary = await jasperReport.jasperInstance.pdf(exportOptions);
                break;
            case 'xlsx':
                binary = await jasperReport.jasperInstance.xlsx(exportOptions);
                break;
            case 'docx':
                binary = await jasperReport.jasperInstance.docx(exportOptions);
                break;
            case 'html':
                binary = await jasperReport.jasperInstance.html(exportOptions);
                break;
            default:
                throw new BadRequestException(`Unsupported format: ${dto.format}`);
        }

        const output = Buffer.isBuffer(binary) ? binary : Buffer.from(binary as any);
        if (!output.length) {
            throw new InternalServerErrorException('Jasper generated an empty report');
        }
        return output;
    }

    // private async loadReportRows(investmentRequestId: string) {
    //     const ir = await this.investmentRequestRepo.findOne({
    //         where: { id: investmentRequestId },
    //         relations: ['approvals', 'approvals.approver', 'approvals.department'],
    //     });

    //     if (!ir) return [];
    //     return [
    //         {
    //             company_name: ir.companyName,
    //             amount: Number(ir.amount),
    //             status: ir.status,
    //             risk_level: ir.riskLevel,
    //             created_at: ir.createdAt,
    //             approval_decision: ir.approvals?.[0]?.decision ?? '',
    //             approver_name: ir.approvals?.[0]?.approver?.name ?? '',
    //             department_name: ir.approvals?.[0]?.department?.name ?? '',
    //         },
    //     ];
    // }
    private async loadReportRows(investmentRequestId: string): Promise<InvestmentReportRow[]> {
        const ir = await this.investmentRequestRepo.findOne({
            where: { id: investmentRequestId },
        });

        if (!ir) return [];

        const approvals = await this.userApprovalRepo.find({
            where: { investmentRequestId },
            relations: {
                user: true,
                department: true,
            },
        });

        // console.log('=== first approval raw ===');
        // console.log(JSON.stringify(approvals[0], null, 2));

        if (approvals.length > 0) {
            return approvals.map((approval) => ({
                company_name: ir.companyName ?? '',
                amount: Number(ir.amount ?? 0),
                status: ir.status ?? '',
                risk_level: ir.riskLevel ?? '',
                created_at: this.formatReportDate(ir.createdAt),
                approval_decision: approval.decision ?? '',
                approver_name: approval.user?.name ?? '',
                department_name: approval.department?.name ?? '',
            }));
        }

        return [
            {
                company_name: ir.companyName ?? '',
                amount: Number(ir.amount ?? 0),
                status: ir.status ?? '',
                risk_level: ir.riskLevel ?? '',
                created_at: this.formatReportDate(ir.createdAt),
                approval_decision: '',
                approver_name: '',
                department_name: '',
            },
        ];
    }

    private formatReportDate(value: Date | string | number | null | undefined): string {
        if (value == null || value === '') return '';

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        return `${String(date.getUTCDate()).padStart(2, '0')}/${String(
            date.getUTCMonth() + 1,
        ).padStart(2, '0')}/${date.getUTCFullYear()}`;
    }
}
export { JasperReportService as JasperService };