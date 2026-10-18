import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JasperModule as NodeJasperModule } from 'node-jasper-ts/nest';
//import java from 'java';
import { JasperTemplate } from './jasper-template.entity.js';
import { JasperReportService } from './jasper.service.js';
import { JasperController } from './jasper.controller.js';
import { InvestmentRequest } from './../investment-requests/investment-requests.entity.js';
import { UserApproval } from '../user_approval/user_approval.entity.js';

// java.classpath.unshift(
//   `${process.cwd()}/node_modules/node-jasper-ts/jar/dist/postgresql-42.7.3.jar`,
// );

@Module({
  imports: [
    TypeOrmModule.forFeature([JasperTemplate, InvestmentRequest, UserApproval]),
    NodeJasperModule.forRoot({
      path: `${process.cwd()}/node_modules/node-jasper-ts/jar`,
      //javaInstance: java,

      tmpPath: `${process.cwd()}/temp`,

      java: [
        '-Djava.awt.headless=true',//it tells java that it is running in a no display env
        '-Xms256m',//it sets the initial heap size to 256 megabytes
        '-Xmx512m',//it sets the maximum heap size to 512 megabytes
      ],

      drivers: {
        postgres: {
          path: `${process.cwd()}/node_modules/node-jasper-ts/jar/dist/postgresql-42.7.3.jar`,//it specifies the path to the PostgreSQL JDBC driver JAR file
          class: 'org.postgresql.Driver',//it specifies the fully qualified class name of the PostgreSQL JDBC driver
          type: 'postgres',
        },
      },

      conns: {
        default: {
          user: process.env.DB_USERNAME || 'postgres',
          pass: process.env.DB_PASSWORD || 'ahmadezz@2005',
          jdbc:
            process.env.DB_JDBC ||
            'jdbc:postgresql://localhost:5433/investment_db',
          driver: 'postgres',
        },
      },

      defaultConn: 'default',
    }),
  ],
  controllers: [JasperController],
  providers: [JasperReportService],
  exports: [JasperReportService],
})
export class JasperModule { }