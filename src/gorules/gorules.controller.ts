import {BadRequestException,Body,Controller,Param,Post,UploadedFile,UseInterceptors,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GoRulesService } from './gorules.service.js';

@ApiTags('GoRules')
@Controller('gorules')
export class GorulesController {
  constructor(private readonly gorulesService: GoRulesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a GoRules JSON file and save it under a name' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Rule name used later to evaluate it' },
        file: { type: 'string', format: 'binary', description: 'GoRules decision JSON file' },
      },
      required: ['name', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Body() body: { name?: string },
  ) {
    const name = body.name?.trim();
    if (!file || !name) {
      throw new BadRequestException('Send a rule name (name) and a JSON file (file)');
    }
    return this.gorulesService.uploadFromFile(name, file.buffer);
  }

  @Post(':name/evaluate')
  @ApiOperation({ summary: 'Evaluate input data against a stored rule' })
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