import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JasperTemplate } from './jasper-template.entity.js';
import { JasperTemplatesController } from './jasper-templates.controller.js';
import { JasperTemplatesService } from './jasper-templates.service.js';
import { JasperRenderPayload } from './jasper-render-payload.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([JasperTemplate, JasperRenderPayload])],
  controllers: [JasperTemplatesController],
  providers: [JasperTemplatesService],
  exports: [JasperTemplatesService],
})
export class JasperTemplatesModule {}