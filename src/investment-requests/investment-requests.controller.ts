import { Body,Controller,Delete,Get,Param,Patch,Post,} from '@nestjs/common';
import { InvestmentRequestsService } from './investment-requests.service.js';
import { CreateInvestmentRequestDto } from './dto/create-investment-dto.js';
import { UpdateInvestmentRequestDto } from './dto/update-investment-dto.js';

@Controller('investment-requests')
export class InvestmentRequestsController {
  constructor(
    private readonly investmentRequestsService: InvestmentRequestsService,
  ) {}

  @Post()
  create(@Body() dto: CreateInvestmentRequestDto) {
    return this.investmentRequestsService.create(dto);
  }

  @Post('evaluate')
  evaluate(@Body() body: { ruleName: string; context: Record<string, any> }) {
    return this.investmentRequestsService.evaluate(body.ruleName, body.context ?? {});
  }

  @Post(':id/start-flow')
  startFlow(
    @Param('id') id: string,
    @Body() body: { ruleName?: string; evaluation?: Record<string, any> },
  ) {
    return this.investmentRequestsService.startFlow(id, body.ruleName, body.evaluation);
  }

  @Get(':id/process')
  async getProcess(@Param('id') id: string) {
    const request = await this.investmentRequestsService.findOne(id);
    return this.investmentRequestsService.getProcess(request);
  }

  @Get(':id/tasks')
  async getTasks(@Param('id') id: string) {
    const request = await this.investmentRequestsService.findOne(id);
    return this.investmentRequestsService.getTasks(request);
  }

  @Post('tasks/:taskId/complete')
  completeTask(
    @Param('taskId') taskId: string,
    @Body() body: { variables?: Array<{ name: string; value: string | number | boolean | null; type?: string }> },
  ) {
    return this.investmentRequestsService.completeTask(taskId, body.variables ?? []);
  }

  @Get()
  findAll() {
    return this.investmentRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investmentRequestsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvestmentRequestDto) {
    return this.investmentRequestsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.investmentRequestsService.remove(id);
  }
}