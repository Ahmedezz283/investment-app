import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './departments.entity.js';
import { User } from '../user/user-entity.js';
import { DepartmentService } from './department.service.js';
import { DepartmentController } from './department.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Department, User])],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}