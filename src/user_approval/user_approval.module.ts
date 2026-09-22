import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserApproval } from './user_approval.entity.js';
import { User } from '../user/user-entity.js';
import { Department } from '../department/departments.entity.js';
import { FlowableModule } from '../flowable/flowable.module.js';
import { UserApprovalService } from './user_approval.service.js';
import { UserApprovalController } from './user_approval.controller.js';
import { InvestmentRequestsModule } from '../investment-requests/investment-requests.module.js';
import { UserModule } from '../user/user-module.js';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserApproval, User, Department]),
    InvestmentRequestsModule,
    FlowableModule,
    UserModule,
  ],
  controllers: [UserApprovalController],
  providers: [UserApprovalService],
})
export class UserApprovalModule {}