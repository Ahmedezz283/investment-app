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

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  users?: User[];
}

export interface User {
  id: string;
  keycloakId: string;
  name: string;
  role: string;
  National_ID: string;
  departmentId?: string | null;
  department?: Department | null;
  IsAssigned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentRequest {
  id: string;
  investorId: string;
  investor?: User;
  companyName: string;
  amount: number;
  status: InvestmentRequestStatus;
  riskLevel: RiskLevel | null;
  flowableProcessInstanceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserApproval {
  id: string;
  investmentRequestId: string;
  userId: string;
  user?: User;
  departmentId: string;
  department?: Department;
  decision: ApprovalDecision;
  decidedAt: string;
}

export interface FlowableTask {
  id: string;
  name: string;
  assignee?: string | null;
  executionId?: string;
  processInstanceId?: string;
  processDefinitionId?: string;
  taskDefinitionKey?: string;
  createTime?: string;
  dueDate?: string | null;
  description?: string | null;
}

export interface AuthTokens {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type: string;
  id_token?: string;
  session_state?: string;
  scope?: string;
}

export interface AuthUser {
  id?: string;
  keycloakId?: string;
  username?: string;
  email?: string;
  name?: string;
  roles?: string[];
  role?: string;
}

