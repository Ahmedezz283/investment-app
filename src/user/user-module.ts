import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user-controller.js';
import { UserService } from './user-service.js';
import { User } from './user-entity.js';
import { KeycloakModule } from '../keycloak/keycloak-module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), KeycloakModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}