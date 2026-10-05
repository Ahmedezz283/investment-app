import {
    Controller,
    Post,
    Get,
    Body,
    Res,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JasperReportService } from './jasper.service.js';
import { CreateJasperTemplateDto } from './dto/create-template.dto.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import type { MulterFile } from './types/multer-file.type.js';

@Controller('jasper')
export class JasperController {
    constructor(private readonly jasperService: JasperReportService) { }

    @Post('templates')
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @Body() dto: CreateJasperTemplateDto,
        @UploadedFile() file: MulterFile,
    ) {
        if (!file) throw new BadRequestException('JRXML file is required');
        return this.jasperService.uploadTemplate(dto, file);
    }

    @Get('templates')
    list() {
        return this.jasperService.listTemplates();
    }

    @Post('generate')
    async generate(@Body() dto: GenerateReportDto) {
        const buffer = await this.jasperService.generate(dto);
        return new StreamableFile(buffer, {
            type: this.mime(dto.format),
            disposition: `attachment; filename="${dto.templateName}.${dto.format}"`,
        });
    }

    private mime(format: string): string {
        const map: Record<string, string> = {
            pdf: 'application/pdf',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            html: 'text/html',
        };
        return map[format] ?? 'application/octet-stream';
    }
}