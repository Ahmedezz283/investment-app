import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../department/departments.entity.js';
import { InvestmentRequest, InvestmentRequestStatus, RiskLevel,} from './investment-requests.entity.js';
import { CreateInvestmentRequestDto } from './dto/create-investment-dto.js';
import { UpdateInvestmentRequestDto } from './dto/update-investment-dto.js';
import { FlowableService } from '../flowable/flowable.service.js';
import { GoRulesContext, GoRulesService } from '../gorules/gorules.service.js';

@Injectable()
export class InvestmentRequestsService {
  constructor(
    @InjectRepository(InvestmentRequest)
    private readonly investmentRequestsRepository: Repository<InvestmentRequest>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly flowableService: FlowableService,
    private readonly goRulesService: GoRulesService,
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

  async startFlow(
    id: string,
    ruleName: string | undefined,
    evaluation: GoRulesContext | undefined,
  ): Promise<InvestmentRequest> {
    const savedRequest = await this.findOne(id);
    const goRulesResponse = evaluation ?? (ruleName
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
    const flowableContext: GoRulesContext = {
      investmentRequestId: savedRequest.id,
      investorId: savedRequest.investorId,
      companyName: savedRequest.companyName,
      amount: savedRequest.amount,
      investmentAmount: savedRequest.amount,
      approvalGroupsJson: JSON.stringify(departments.map(({ name }) => name)),
      ...goRulesResponse,
    };
    if (typeof goRulesResponse.slaHours === 'number') {
      flowableContext.slaDuration = `PT${goRulesResponse.slaHours}H`;
    }
    console.log('Variables being sent to Flowable:', JSON.stringify({
      investmentRequestId: savedRequest.id,
      investorId: savedRequest.investorId,
      companyName: savedRequest.companyName,
      amount: savedRequest.amount,
    }, null, 2));
    const variables = Object.entries(flowableContext)
      .filter(([, value]) => value === null || typeof value !== 'object')
      .map(([name, value]) => ({
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

    savedRequest.flowableProcessInstanceId = process.id;
    savedRequest.status = InvestmentRequestStatus.IN_PROGRESS;
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