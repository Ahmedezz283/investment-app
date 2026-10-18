import { BadRequestException, Body, Controller, Get, Param, Post, UploadedFile, UploadedFiles, UseInterceptors, } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GoRulesService } from './gorules.service.js';
import type { MulterFile } from './../jasper/types/multer-file.type.js';


@ApiTags('GoRules')
@Controller('gorules')
export class GorulesController {
  constructor(private readonly gorulesService: GoRulesService) { }


  @Get()
  getall() {
    return this.gorulesService.findAll();
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Rule name used later to evaluate it',
        },
        ruleFile: {
          type: 'string',
          format: 'binary',
          description: 'GoRules decision JSON file',
        },
        dictionaryFile: {
          type: 'string',
          format: 'binary',
          description: 'Dictionary JSON file',
        },
      },
      required: ['name', 'ruleFile', 'dictionaryFile'],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'ruleFile', maxCount: 1 },
      { name: 'dictionaryFile', maxCount: 1 },
    ]),
  )
    async upload(
      @UploadedFiles()
      files: {
        ruleFile?: MulterFile[];
        dictionaryFile?: MulterFile[];
      },
      @Body() body: { name?: string },
    ) {
    const name = body.name?.trim();
    const ruleFile = files.ruleFile?.[0];
    const dictionaryFile = files.dictionaryFile?.[0];

    if (!name || !ruleFile || !dictionaryFile) {
      throw new BadRequestException(
        'Send a rule name (name), a rule JSON (ruleFile) and a dictionary JSON (dictionaryFile)',
      );
    }

    return this.gorulesService.uploadFromFiles(
      name,
      ruleFile.buffer,
      dictionaryFile.buffer,
    );
  }

  @Post(':name/evaluate')
  @ApiParam({ name: 'name', description: 'Rule name used at upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        context: { type: 'object', example: { investmentAmount: 500000 } },
      },
      required: ['context'],
    },
  })
  evaluate(
    @Param('name') name: string,
    @Body() body: { context?: Record<string, any> },
  ) {
    return this.gorulesService.evaluate(name, body.context ?? {});
  }
}