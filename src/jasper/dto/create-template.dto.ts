import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateJasperTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; 
}