import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../user/user-entity.js';
import { Department } from '../department/departments.entity.js';
import { InvestmentRequest } from '../investment-requests/investment-requests.entity.js';

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('user_approvals')
export class UserApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'investment_request_id', type: 'uuid' })
  investmentRequestId: string;

  @ManyToOne(() => InvestmentRequest)
  investmentRequest: Relation<InvestmentRequest>;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  user: Relation<User>;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Department)
  department: Relation<Department>;

  @Column({ type: 'enum', enum: ApprovalDecision })
  decision: ApprovalDecision;

  @CreateDateColumn({ name: 'decided_at' })
  decidedAt: Date;
}