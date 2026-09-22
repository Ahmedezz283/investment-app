import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../department/departments.entity.js';
import {
  InvestmentRequest,
  InvestmentRequestStatus,
  RiskLevel,
} from './investment-requests.entity.js';
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

  async create(dto: CreateInvestmentRequestDto): Promise<InvestmentRequest> {
    const goRulesResponse = await this.goRulesService.evaluate({
      investmentAmount: dto.amount,
    });
    const request = this.investmentRequestsRepository.create(dto);
    // if (
    //   goRulesResponse.riskLevel === 'LOW' ||
    //   goRulesResponse.riskLevel === 'MEDIUM' ||
    //   goRulesResponse.riskLevel === 'HIGH'
    // ) {
    // }
    request.riskLevel = goRulesResponse.riskLevel as RiskLevel;
    const savedRequest = await this.investmentRequestsRepository.save(request);
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
    const process = await this.flowableService.startInvestmentProcess(
      savedRequest.id,
      Object.entries(flowableContext)
        .filter(([, value]) => value === null || typeof value !== 'object')
        .map(([name, value]) => ({
          name,
          value,
          ...(value !== null && { type: typeof value === 'number' ? 'double' : typeof value }),
        })),
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