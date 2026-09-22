import { IsEnum } from 'class-validator';
import { ApprovalDecision } from '../user_approval.entity.js';

export class CreateUserApprovalDto {
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;
}