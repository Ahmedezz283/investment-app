import { Module } from '@nestjs/common';
import { GoRulesService } from './gorules.service.js';

@Module({
  providers: [GoRulesService],
  exports: [GoRulesService],
})
export class GoRulesModule {}
