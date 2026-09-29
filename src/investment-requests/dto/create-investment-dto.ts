import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateInvestmentRequestDto {
  @IsUUID()
  investorId: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  ruleName: string;
}