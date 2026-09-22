import { IsUUID } from 'class-validator';

export class AssignDepartmentDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  departmentId: string;
}