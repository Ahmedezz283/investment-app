import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  templateName: string;

  @IsIn(['png', 'pdf', 'xlsx', 'docx', 'html'])
  format: 'png' | 'pdf' | 'xlsx' | 'docx' | 'html' = 'pdf';

  @IsObject()
  params: {
    investmentRequestId: string;
    notificationType?: string;
  };
}