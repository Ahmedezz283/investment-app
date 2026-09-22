import { Module } from '@nestjs/common';
import { FlowableService } from './flowable.service.js';

@Module({
  providers: [FlowableService],
  exports: [FlowableService],
})
export class FlowableModule {}
