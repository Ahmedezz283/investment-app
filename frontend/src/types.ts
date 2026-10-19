export type InvestmentStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export interface InvestmentRequest {
  id: string;
  investorId: string;
  companyName: string;
  amount: number;
  status: InvestmentStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Investor {
  id: string;
  name: string;
  role?: string;
  keycloakId?: string;
}

export interface AccessTokenClaims {
  sub?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  exp?: number;
  realm_access?: { roles?: string[] };
}

export interface LoginResponse {
  access_token: string;
  expires_in?: number;
}
