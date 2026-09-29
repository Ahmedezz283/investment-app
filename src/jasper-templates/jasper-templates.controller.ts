import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JasperTemplatesService } from './jasper-templates.service.js';
import { RenderTemplateDto } from './dto/render-template.dto.js';

@Controller('jasper/templates')
export class JasperTemplatesController {
  constructor(private readonly templatesService: JasperTemplatesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @Body('name') name: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
  ) {
    if (typeof name !== 'string') {
      throw new BadRequestException('Template name is required');
    }
    return this.templatesService.upload(name, file);
  }

  @Put(':name')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  replace(
    @Param('name') name: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
  ) {
    return this.templatesService.replace(name, file);
  }

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Post(':name/render')
  async render(
    @Param('name') name: string,
    @Body() body: RenderTemplateDto,
    @Res() response: Response,
  ) {
    const pdf = await this.templatesService.render(name, body);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}.pdf"`,
    });
    response.send(pdf);
  }

  @Get(':name/file')
  async download(@Param('name') name: string, @Res() response: Response) {
    const template = await this.templatesService.findOne(name);
    response.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(template.fileName)}`,
    });
    response.send(template.content);
  }
}