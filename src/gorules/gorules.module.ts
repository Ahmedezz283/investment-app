import { Module } from '@nestjs/common';
import { GoRulesService } from './gorules.service.js';
import { GorulesController } from './gorules.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gorule } from './gorules.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gorule]),
  ],
  providers: [GoRulesService],
  exports: [GoRulesService],
  controllers: [GorulesController],
})
export class GoRulesModule {}
