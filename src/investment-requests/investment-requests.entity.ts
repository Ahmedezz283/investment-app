import { Column,CreateDateColumn,Entity,ManyToOne,PrimaryGeneratedColumn,UpdateDateColumn,} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../user/user-entity.js';

export enum InvestmentRequestStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('investment_requests')
export class InvestmentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'investor_id', type: 'uuid' })
  investorId: string;

  @ManyToOne(() => User)
  investor: Relation<User>;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  companyName: string;

  @Column({
    type: 'enum',
    enum: InvestmentRequestStatus,
    default: InvestmentRequestStatus.DRAFT,
  })
  status: InvestmentRequestStatus;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: RiskLevel,
    nullable: true,
  })
  riskLevel: RiskLevel | null;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({ name: 'flowable_process_instance_id', type: 'varchar', nullable: true })
  flowableProcessInstanceId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}