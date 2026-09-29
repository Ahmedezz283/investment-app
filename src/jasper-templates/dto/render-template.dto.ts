import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsString,
} from 'class-validator';

export class RenderTemplateDto {
  @IsString()
  @IsNotEmpty()
  investmentRequestId: string;

  @IsIn(['APPROVAL', 'REJECTION', 'REPORT'])
  notificationType: 'APPROVAL' | 'REJECTION' | 'REPORT';

  @IsArray()
  @ArrayMaxSize(1000)
  @IsObject({ each: true })
  rows: Array<Record<string, unknown>>;
}