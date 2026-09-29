import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth-module.js';
import { UserModule } from './user/user-module.js';
import { InvestmentRequestsModule } from './investment-requests/investment-requests.module.js';
import { DepartmentModule } from './department/department.module.js';
import { UserApprovalModule } from './user_approval/user_approval.module.js';
import { FlowableModule } from './flowable/flowable.module.js';
import { GoRulesModule } from './gorules/gorules.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { JasperTemplatesModule } from './jasper-templates/jasper-templates.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'ahmadezz@2005',
      database: process.env.DB_DATABASE ?? process.env.DB_NAME ?? 'investment_db',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
      migrationsRun: true,
    }),
    AuthModule,
    UserModule,
    InvestmentRequestsModule,
    DepartmentModule,
    UserApprovalModule,
    FlowableModule,
    GoRulesModule,
    NotificationModule,
    JasperTemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}