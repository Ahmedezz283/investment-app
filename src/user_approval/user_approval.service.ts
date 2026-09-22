import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalDecision, UserApproval } from './user_approval.entity.js';
import { User } from '../user/user-entity.js';
import { Department } from '../department/departments.entity.js';
import { InvestmentRequestsService } from '../investment-requests/investment-requests.service.js';
import { InvestmentRequestStatus } from '../investment-requests/investment-requests.entity.js';
import { FlowableService } from '../flowable/flowable.service.js';

@Injectable()
export class UserApprovalService {
  constructor(
    @InjectRepository(UserApproval)
    private readonly userApprovalRepository: Repository<UserApproval>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly investmentRequestsService: InvestmentRequestsService,
    private readonly flowableService: FlowableService,
  ) {}

  async recordDecision(
    investmentRequestId: string,
    userId: string,
    decision: ApprovalDecision,
  ): Promise<UserApproval> {
    const request = await this.investmentRequestsService.findOne(investmentRequestId);

    const approver = await this.userRepository.findOne({ where: { id: userId } });
    if (!approver) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (!approver.departmentId) {
      throw new ConflictException(
        'This user has no department assigned and cannot approve.',
      );
    }

    const department = await this.departmentRepository.findOne({
      where: { id: approver.departmentId },
    });
    if (!department) {
      throw new NotFoundException(`Department ${approver.departmentId} not found`);
    }

    const existing = await this.userApprovalRepository.findOne({
      where: { investmentRequestId, userId },
    });
    if (existing) {
      throw new ConflictException(
        'This user has already decided on this investment request.',
      );
    }

    if (!request.flowableProcessInstanceId) {
      throw new ConflictException('Investment has no active Flowable process.');
    }

    const tasks = await this.flowableService.getTasksForCandidateGroup(
      request.flowableProcessInstanceId,
      department.name,
    );
    const task = tasks[0];
    if (!task) {
      throw new ConflictException(
        `No active approval task is assigned to department ${department.name}.`,
      );
    }

    await this.flowableService.completeTask(task.id, [
      {
        name: 'approved',
        value: decision === ApprovalDecision.APPROVED,
        type: 'boolean',
        scope: 'global',
      },
    ]);

    const approval = this.userApprovalRepository.create({
      investmentRequestId,
      userId,
      departmentId: approver.departmentId,
      decision,
    });
    const saved = await this.userApprovalRepository.save(approval);

    if (decision === ApprovalDecision.REJECTED) {
      await this.investmentRequestsService.update(investmentRequestId, {
        status: InvestmentRequestStatus.REJECTED,
      });
      return saved;
    }

    await this.evaluateAndAdvance(investmentRequestId);
    return saved;
  }

  private async evaluateAndAdvance(investmentRequestId: string): Promise<void> {
    const approvals = await this.userApprovalRepository.find({
      where: { investmentRequestId, decision: ApprovalDecision.APPROVED },
    });

    if (approvals.length > 0) {
      await this.investmentRequestsService.update(investmentRequestId, {
        status: InvestmentRequestStatus.APPROVED,
      });
    }
  }

  findForRequest(investmentRequestId: string): Promise<UserApproval[]> {
    return this.userApprovalRepository.find({
      where: { investmentRequestId },
      order: { decidedAt: 'ASC' },
    });
  }
}