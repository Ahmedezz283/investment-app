import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Department } from '../department/departments.entity.js';
import { InvestmentRequest, InvestmentRequestStatus, RiskLevel, } from './investment-requests.entity.js';
import { CreateInvestmentRequestDto } from './dto/create-investment-dto.js';
import { UpdateInvestmentRequestDto } from './dto/update-investment-dto.js';
import { FlowableService } from '../flowable/flowable.service.js';
import { GoRulesContext, GoRulesService } from '../gorules/gorules.service.js';
import { User } from '../user/user-entity.js';
import { UserApproval } from '../user_approval/user_approval.entity.js';
import { KeycloakAdminService } from '../keycloak/keycloak-admin-service.js';
import { NOTIFICATIONS_KAFKA_CLIENT } from '../kafka/kafka.module.js';
import { JasperTemplatesService } from '../jasper-templates/jasper-templates.service.js';

interface InvestmentReportRow extends Record<string, unknown> {
  company_name: string;
  amount: string;
  status: InvestmentRequestStatus;
  risk_level: RiskLevel | null;
  created_at: Date;
  approval_decision: string | null;
  approver_name: string | null;
  department_name: string | null;
}

@Injectable()
export class InvestmentRequestsService {
  constructor(
    @InjectRepository(InvestmentRequest)
    private readonly investmentRequestsRepository: Repository<InvestmentRequest>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly flowableService: FlowableService,
    private readonly goRulesService: GoRulesService,
    private readonly keycloakAdminService: KeycloakAdminService,
    @Inject(NOTIFICATIONS_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
    private readonly jasperTemplatesService: JasperTemplatesService,
    private readonly configService: ConfigService,
  ) { }

  create(dto: CreateInvestmentRequestDto): Promise<InvestmentRequest> {
    return this.investmentRequestsRepository.save(
      this.investmentRequestsRepository.create({
        ...dto,
        status: InvestmentRequestStatus.DRAFT,
        riskLevel: null,
        flowableProcessInstanceId: null,
      }),
    );
  }

  evaluate(ruleName: string, context: GoRulesContext) {
    return this.goRulesService.evaluate(ruleName, context);
  }

  // async startFlow(
  //   id: string,
  //   ruleName: string | undefined,
  //   evaluation: GoRulesContext | undefined,
  // ): Promise<InvestmentRequest> {
  //   const savedRequest = await this.findOne(id);
  //   const goRulesResponse = evaluation ?? (ruleName
  //     ? await this.evaluate(ruleName, { investmentAmount: savedRequest.amount })
  //     : undefined);

  //   if (!goRulesResponse) {
  //     throw new BadRequestException('Provide ruleName or an evaluation result');
  //   }

  //   if (goRulesResponse.riskLevel) {
  //     savedRequest.riskLevel = goRulesResponse.riskLevel as RiskLevel;
  //   }
  //   const departments = await this.departmentRepository.find({
  //     order: { name: 'ASC' },
  //   });
  //   const flowableContext: GoRulesContext = {
  //     investmentRequestId: savedRequest.id,
  //     investorId: savedRequest.investorId,
  //     companyName: savedRequest.companyName,
  //     amount: savedRequest.amount,
  //     investmentAmount: savedRequest.amount,
  //     approvalGroupsJson: JSON.stringify(departments.map(({ name }) => name)),
  //     ruleName: ruleName,
  //     ...goRulesResponse,
  //   };
  //   if (typeof goRulesResponse.slaHours === 'number') {
  //     flowableContext.slaDuration = `PT${goRulesResponse.slaHours}H`;
  //   }
  //   console.log('Variables being sent to Flowable:', JSON.stringify({
  //     investmentRequestId: savedRequest.id,
  //     investorId: savedRequest.investorId,
  //     companyName: savedRequest.companyName,
  //     amount: savedRequest.amount,
  //   }, null, 2));
  //   const variables = Object.entries(flowableContext)
  //     .filter(([, value]) => value === null || typeof value !== 'object')
  //     .map(([name, value]) => ({
  //       name,
  //       value: value as string | number | boolean | null,
  //       ...(value !== null && {
  //         type: typeof value === 'number' ? 'double' : typeof value,
  //       }),
  //     }));

  //   const process = await this.flowableService.startInvestmentProcess(
  //     savedRequest.id,
  //     variables,
  //   );

  //   savedRequest.flowableProcessInstanceId = process.id;
  //   savedRequest.status = InvestmentRequestStatus.IN_PROGRESS;
  //   return this.investmentRequestsRepository.save(savedRequest);
  // }
  async startFlow(
    id: string,
    ruleName: string | undefined,
    evaluation: GoRulesContext | undefined,
  ): Promise<InvestmentRequest> {
    const savedRequest = await this.findOne(id);

    const goRulesResponse =
      evaluation ??
      (ruleName
        ? await this.evaluate(ruleName, { investmentAmount: savedRequest.amount })
        : undefined);

    if (!goRulesResponse) {
      throw new BadRequestException('Provide ruleName or an evaluation result');
    }

    if (goRulesResponse.riskLevel) {
      savedRequest.riskLevel = goRulesResponse.riskLevel as RiskLevel;
    }

    const departments = await this.departmentRepository.find({
      order: { name: 'ASC' },
    });

    const minApprovalsRequired =
      typeof goRulesResponse.minApprovalsRequired === 'number'
        ? goRulesResponse.minApprovalsRequired
        : 1;

    const slaHours =
      typeof goRulesResponse.slaHours === 'number' ? goRulesResponse.slaHours : 24;

    const flowableContext: GoRulesContext = {
      investmentRequestId: savedRequest.id,
      investorId: savedRequest.investorId,
      companyName: savedRequest.companyName,
      amount: savedRequest.amount,
      investmentAmount: savedRequest.amount,
      riskLevel: savedRequest.riskLevel ?? goRulesResponse.riskLevel ?? 'LOW',
      approvalGroupsJson: JSON.stringify(departments.map((d) => d.name)),
      minApprovalsRequired,
      slaDuration: `PT${slaHours}H`,
      ruleName: ruleName ?? '',
      ...Object.fromEntries(
        Object.entries(goRulesResponse).filter(
          ([, v]) => v === null || typeof v !== 'object',
        ),
      ),
    };

    const variables = Object.entries(flowableContext).map(([name, value]) => ({
      name,
      value: value as string | number | boolean | null,
      ...(value !== null && {
        type: typeof value === 'number' ? 'double' : typeof value,
      }),
    }));

    const process = await this.flowableService.startInvestmentProcess(
      savedRequest.id,
      variables,
    );

    const normalizedRisk = (savedRequest.riskLevel || '').toString().toLowerCase();

    if (normalizedRisk === 'low') {
      savedRequest.status = InvestmentRequestStatus.APPROVED;
    } else if (normalizedRisk === 'rejected') {
      savedRequest.status = InvestmentRequestStatus.REJECTED;
    } else {
      savedRequest.status = InvestmentRequestStatus.IN_PROGRESS;
    }

    savedRequest.flowableProcessInstanceId = process.id;
    return this.investmentRequestsRepository.save(savedRequest);
  }

  getProcess(request: InvestmentRequest): Promise<unknown> {
    if (!request.flowableProcessInstanceId) {
      return Promise.resolve(null);
    }
    return this.flowableService.getProcessInstance(request.flowableProcessInstanceId);
  }

  getTasks(request: InvestmentRequest): Promise<unknown> {
    if (!request.flowableProcessInstanceId) {
      return Promise.resolve([]);
    }
    return this.flowableService.getActiveTasks(request.flowableProcessInstanceId);
  }

  completeTask(taskId: string, variables: Array<{ name: string; value: string | number | boolean | null; type?: string }>) {
    return this.flowableService.completeTask(taskId, variables);
  }

  findAll(): Promise<InvestmentRequest[]> {
    return this.investmentRequestsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async requestReport(
    id: string,
    notificationType?: 'APPROVAL' | 'REJECTION',
    templateName?: string,
  ): Promise<{ message: string }> {
    const request = await this.findOne(id);
    const investor = await this.userRepository.findOne({
      where: { id: request.investorId },
    });
    if (!investor) {
      throw new NotFoundException(`Investor for request ${id} not found`);
    }

    const keycloakUser = await this.keycloakAdminService.getUser(investor.keycloakId);
    if (!keycloakUser?.email) {
      throw new BadRequestException('Investor does not have an email address');
    }

    const rows = await this.investmentRequestsRepository
      .createQueryBuilder('request')
      .leftJoin(UserApproval, 'approval', 'approval.investmentRequestId = request.id')
      .leftJoin(User, 'approver', 'approver.id = approval.userId')
      .leftJoin(Department, 'department', 'department.id = approval.departmentId')
      .select('request.companyName', 'company_name')
      .addSelect('request.amount', 'amount')
      .addSelect('request.status', 'status')
      .addSelect('request.riskLevel', 'risk_level')
      .addSelect('request.createdAt', 'created_at')
      .addSelect('approval.decision', 'approval_decision')
      .addSelect('approver.name', 'approver_name')
      .addSelect('department.name', 'department_name')
      .where('request.id = :id', { id })
      .orderBy('approval.decidedAt', 'ASC')
      .getRawMany<InvestmentReportRow>();

    const reportType = notificationType ?? 'REPORT';
    const selectedTemplate = templateName?.trim()
      || this.configService.get<string>('JASPER_TEMPLATE_NAME', 'investment');
    const pdf = await this.jasperTemplatesService.render(selectedTemplate, {
      investmentRequestId: request.id,
      notificationType: reportType,
      rows,
    });

    await firstValueFrom(
      this.kafkaClient.emit('investment.report.rendered', {
        investmentRequestId: request.id,
        recipientEmail: keycloakUser.email,
        notificationType: reportType,
        pdfBase64: pdf.toString('base64'),
      }),
    );

    return { message: 'Rendered report queued for email delivery' };
  }

  async findOne(id: string): Promise<InvestmentRequest> {
    const request = await this.investmentRequestsRepository.findOne({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Investment request ${id} not found`);
    }
    return request;
  }

  async update(
    id: string,
    dto: UpdateInvestmentRequestDto,
  ): Promise<InvestmentRequest> {
    const request = await this.findOne(id);
    Object.assign(request, dto);
    return this.investmentRequestsRepository.save(request);
  }

  async remove(id: string): Promise<void> {
    const result = await this.investmentRequestsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Investment request ${id} not found`);
    }
  }
}