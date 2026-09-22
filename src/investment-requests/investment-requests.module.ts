import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentRequestsController } from './investment-requests.controller.js';
import { InvestmentRequestsService } from './investment-requests.service.js';
import { InvestmentRequest } from './investment-requests.entity.js';
import { Department } from '../department/departments.entity.js';
import { UserModule } from '../user/user-module.js';
import { FlowableModule } from '../flowable/flowable.module.js';
import { GoRulesModule } from '../gorules/gorules.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvestmentRequest, Department]),
    UserModule,
    FlowableModule,
    GoRulesModule,
  ],
  controllers: [InvestmentRequestsController],
  providers: [InvestmentRequestsService],
  exports: [InvestmentRequestsService],
})
export class InvestmentRequestsModule {}