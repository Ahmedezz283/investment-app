import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    keycloakId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    role: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(14)
    @MaxLength(14)
    National_ID: string;

    @IsBoolean()
    @IsOptional()
    IsAssigned?: boolean;

    @IsString()
    @IsOptional()
    departmentId?: string;
}