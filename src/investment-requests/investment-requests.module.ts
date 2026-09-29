import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentRequestsController } from './investment-requests.controller.js';
import { InvestmentRequestsService } from './investment-requests.service.js';
import { InvestmentRequest } from './investment-requests.entity.js';
import { Department } from '../department/departments.entity.js';
import { User } from '../user/user-entity.js';
import { UserModule } from '../user/user-module.js';
import { UserApproval } from '../user_approval/user_approval.entity.js';
import { FlowableModule } from '../flowable/flowable.module.js';
import { GoRulesModule } from '../gorules/gorules.module.js';
import { KeycloakModule } from '../keycloak/keycloak-module.js';
import { KafkaModule } from '../kafka/kafka.module.js';
import { JasperTemplatesModule } from '../jasper-templates/jasper-templates.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvestmentRequest, Department, User, UserApproval]),
    UserModule,
    FlowableModule,
    GoRulesModule,
    KeycloakModule,
    KafkaModule,
    JasperTemplatesModule,
  ],
  controllers: [InvestmentRequestsController],
  providers: [InvestmentRequestsService],
  exports: [InvestmentRequestsService],
})
export class InvestmentRequestsModule {}