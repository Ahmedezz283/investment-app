import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { InvestmentRequestStatus, RiskLevel } from '../investment-requests.entity.js';

export class UpdateInvestmentRequestDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(InvestmentRequestStatus)
  status?: InvestmentRequestStatus;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
}